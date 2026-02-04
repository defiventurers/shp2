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
  console.log("📦 Starting FINAL Bangalore inventory import");

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV NOT FOUND: ${CSV_PATH}`);
  }

  console.log("📥 Using CSV:", CSV_PATH);

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;
  let skipped = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          // 🔑 NORMALIZE FIELDS
          const name =
            row.medicine_name ||
            row.product_name ||
            row.name ||
            row.drug_name;

          const price =
            row.price ||
            row.mrp ||
            row.selling_price;

          if (!name || !price) {
            skipped++;
            return;
          }

          await db.insert(medicines).values({
            name: String(name).trim(),
            manufacturer: row.manufacturer?.trim() || null,
            genericName: row.composition || null,

            imageUrl:
              row.image_url && String(row.image_url).trim() !== ""
                ? String(row.image_url).trim()
                : null,

            price: String(price),
            mrp: String(price),
            packSize: row.pack_size ? String(row.pack_size) : "1",
            stock: 100,
            requiresPrescription: row.rx_flag === "true",
            isScheduleH: row.rx_flag === "true",
            categoryId: null,
          });

          inserted++;

          if (inserted % 500 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch (err) {
          skipped++;
        }
      })
      .on("end", () => {
        console.log(`✅ IMPORT COMPLETE`);
        console.log(`➕ Inserted: ${inserted}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        resolve();
      })
      .on("error", reject);
  });
}