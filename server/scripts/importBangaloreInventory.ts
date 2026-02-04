import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

const CSV_PATH = path.join(
  process.cwd(),
  "server",
  "data",
  "easyload_inventory.csv"
);

export async function importBangaloreInventory() {
  console.log("📦 Starting Bangalore inventory import");

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV NOT FOUND: ${CSV_PATH}`);
  }

  console.log(`📥 Using CSV: ${CSV_PATH}`);

  /* -----------------------------
     CLEAR EXISTING INVENTORY
  ------------------------------ */
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;
  let skipped = 0;
  const batch: any[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header
              .replace(/^\uFEFF/, "") // BOM
              .replace(/\s+/g, " ")   // normalize spaces
              .trim()
              .toLowerCase(),
        })
      )
      .on("data", async (row) => {
        try {
          /* -----------------------------
             EXACT 6 COLUMN READ
          ------------------------------ */
          const nameRaw = row["medicine name"];
          const priceRaw = row["price"];
          const packSizeRaw = row["quantity(pack size)"];
          const rxRaw = row["is prescription required?"];
          const manufacturerRaw = row["manufacturer"];
          const imageUrlRaw = row["image url"];

          /* -----------------------------
             HARD VALIDATION
          ------------------------------ */
          if (!nameRaw || !priceRaw || !packSizeRaw) {
            skipped++;
            return;
          }

          const price = Number(
            String(priceRaw).replace(/[₹,]/g, "").trim()
          );
          if (!Number.isFinite(price)) {
            skipped++;
            return;
          }

          const packSize = Number(packSizeRaw);
          if (!Number.isFinite(packSize)) {
            skipped++;
            return;
          }

          const isRx =
            String(rxRaw || "")
              .trim()
              .toLowerCase() === "yes";

          /* -----------------------------
             PREPARE ROW
          ------------------------------ */
          batch.push({
            name: String(nameRaw).trim().toUpperCase(),

            price,
            mrp: price,

            packSize,

            manufacturer: manufacturerRaw
              ? String(manufacturerRaw).trim()
              : null,

            imageUrl:
              imageUrlRaw && String(imageUrlRaw).trim() !== ""
                ? String(imageUrlRaw).trim()
                : null,

            requiresPrescription: isRx,
            isScheduleH: isRx,

            stock: null,
            categoryId: null,
            genericName: null,
          });

          /* -----------------------------
             BATCH INSERT
          ------------------------------ */
          if (batch.length === 500) {
            await db.insert(medicines).values(batch.splice(0));
            inserted += 500;
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch (err) {
          skipped++;
          console.error("❌ ROW FAILED:", err);
        }
      })
      .on("end", async () => {
        if (batch.length) {
          await db.insert(medicines).values(batch);
          inserted += batch.length;
        }

        console.log("✅ IMPORT COMPLETE");
        console.log(`➕ Inserted: ${inserted}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        resolve();
      })
      .on("error", reject);
  });
}