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

  console.log("📥 Using CSV:", CSV_PATH);

  // 🔥 Replace inventory completely
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;
  let skipped = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          const name = row["Medicine Name"];
          const price = row["Price"];
          const packSize = row["Quantity(Pack Size)"];

          if (!name || !price || !packSize) {
            skipped++;
            return;
          }

          await db.insert(medicines).values({
            // ✅ ALL CAPS
            name: String(name).trim().toUpperCase(),

            price: String(price),
            mrp: String(price),

            // ✅ Quantity = pack size (e.g. 10 tabs per strip)
            packSize: Number(packSize),

            manufacturer: row["Manufacturer"]?.trim() || null,

            imageUrl:
              row["Image URL"] && row["Image URL"].trim() !== ""
                ? row["Image URL"].trim()
                : null,

            stock: null,
            requiresPrescription:
              String(row["Is Prescription Required?"]).toLowerCase() === "yes",

            isScheduleH:
              String(row["Is Prescription Required?"]).toLowerCase() === "yes",

            categoryId: null,
            genericName: null,
          });

          inserted++;

          if (inserted % 500 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch {
          skipped++;
        }
      })
      .on("end", () => {
        console.log("✅ IMPORT COMPLETE");
        console.log(`➕ Inserted: ${inserted}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        resolve();
      })
      .on("error", reject);
  });
}