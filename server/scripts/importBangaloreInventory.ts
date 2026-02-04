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
  console.log("📄 CSV size:", fs.statSync(CSV_PATH).size);

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;
  let skipped = 0;
  const batch: any[] = [];
  const BATCH_SIZE = 200;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header
              .replace(/^\uFEFF/, "")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase(),
        })
      )
      .on("data", async (row) => {
        try {
          const name = row["medicine name"]?.trim();
          const priceRaw = row["price"]?.trim();

          if (!name || !priceRaw) {
            skipped++;
            return;
          }

          const price = Number(priceRaw.replace(/[₹,]/g, ""));
          if (Number.isNaN(price)) {
            skipped++;
            return;
          }

          const packSizeRaw = row["pack-size"]?.trim();
          const packSize =
            packSizeRaw && packSizeRaw !== "000"
              ? Number(packSizeRaw)
              : null;

          const isRx =
            row["is prescription required?"]?.toLowerCase() === "yes";

          const imageUrl = row["image url"]?.trim();
          const sourceFile = row["source file"]?.trim() || null;

          batch.push({
            name,
            manufacturer: row["manufacturer"] || "Not Known",
            price: price.toFixed(2),
            mrp: price.toFixed(2),
            packSize,
            stock: null,
            requiresPrescription: isRx,
            isScheduleH: isRx,
            imageUrl: imageUrl || null,
            sourceFile,
          });

          if (batch.length >= BATCH_SIZE) {
            await db.insert(medicines).values(batch.splice(0));
            inserted += BATCH_SIZE;
            console.log(`➕ Inserted ${inserted}`);
          }
        } catch (err) {
          skipped++;
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