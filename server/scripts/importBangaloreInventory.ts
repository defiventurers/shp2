import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

const CSV_PATHS = [
  path.join(process.cwd(), "server", "data", "bangalore_inventory_45k_master.csv"),
  path.join(process.cwd(), "data", "bangalore_inventory_45k_master.csv"),
];

const BATCH_SIZE = 500;
const MAX_ROWS = 50_000;

export async function importBangaloreInventory() {
  console.log("📦 Bangalore inventory import started");

  const csvPath = CSV_PATHS.find((p) => fs.existsSync(p));

  if (!csvPath) {
    throw new Error(
      "CSV NOT FOUND. Checked:\n" + CSV_PATHS.join("\n")
    );
  }

  console.log("📥 Using CSV:", csvPath);

  // 🔥 FULL REPLACEMENT
  console.log("🧨 Clearing existing medicines...");
  await db.delete(medicines);

  let buffer: any[] = [];
  let inserted = 0;
  let skipped = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          if (inserted >= MAX_ROWS) return;

          const name = row.medicine_name?.trim();
          const manufacturer = row.manufacturer?.trim();
          const price = parseFloat(row.price);

          if (!name || !manufacturer || isNaN(price)) {
            skipped++;
            return;
          }

          buffer.push({
            name,
            manufacturer,
            genericName: row.composition || null,
            price: price.toFixed(2),
            mrp: price.toFixed(2),
            packSize: row.pack_size ? Number(row.pack_size) : null,
            stock: 100,
            requiresPrescription: row.rx_flag === "true" || row.rx_flag === true,
            isScheduleH: row.rx_flag === "true" || row.rx_flag === true,
            isOtc: row.otc_flag === "true" || row.otc_flag === true,
            isAyurvedic: row.ayurvedic_flag === "true" || row.ayurvedic_flag === true,
          });

          if (buffer.length >= BATCH_SIZE) {
            await db.insert(medicines).values(buffer);
            inserted += buffer.length;
            buffer = [];

            if (inserted % 5000 === 0) {
              console.log(`➕ Inserted ${inserted} medicines`);
            }
          }
        } catch (err) {
          skipped++;
        }
      })
      .on("end", async () => {
        try {
          if (buffer.length > 0) {
            await db.insert(medicines).values(buffer);
            inserted += buffer.length;
          }

          console.log("✅ Bangalore inventory import completed");
          console.log(`📊 Inserted: ${inserted}`);
          console.log(`⚠️ Skipped: ${skipped}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
}