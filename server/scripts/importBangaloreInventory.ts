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
  console.log("📦 Starting Bangalore inventory import (FINAL VERIFIED CSV)");

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV NOT FOUND: ${CSV_PATH}`);
  }

  console.log(`📥 Using CSV: ${CSV_PATH}`);

  /* -----------------------------
     HARD RESET (INTENTIONAL)
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
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase(),
        })
      )
      .on("data", async (row) => {
        try {
          /* -----------------------------
             READ EXACT 7 COLUMNS
          ------------------------------ */
          const nameRaw = row["medicine name"];
          const priceRaw = row["price"];
          const rxRaw = row["is prescription required?"];
          const packSizeRaw = row["pack-size"];
          const manufacturerRaw = row["manufacturer"];
          const imageUrlRaw = row["image url"];
          const sourceFileRaw = row["source file"];

          /* -----------------------------
             VALIDATION (STRICT BUT FAIR)
          ------------------------------ */
          if (!nameRaw || !priceRaw) {
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

          // Pack-Size logic:
          // "000" or non-numeric → null
          let packSize: number | null = null;
          if (
            packSizeRaw &&
            String(packSizeRaw).trim() !== "" &&
            String(packSizeRaw) !== "000"
          ) {
            const parsed = Number(packSizeRaw);
            packSize = Number.isFinite(parsed) ? parsed : null;
          }

          const isRx =
            String(rxRaw || "")
              .trim()
              .toLowerCase() === "yes";

          /* -----------------------------
             PREPARE INSERT
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

            sourceFile:
              sourceFileRaw && String(sourceFileRaw).trim() !== ""
                ? String(sourceFileRaw).trim()
                : null,

            requiresPrescription: isRx,
            isScheduleH: isRx,

            stock: null,
            categoryId: null,
            genericName: null,
          });

          if (batch.length === 200) {
            await db.insert(medicines).values(batch.splice(0));
            inserted += 200;
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
        console.log("🎯 Expected total: 18433");
        resolve();
      })
      .on("error", reject);
  });
}