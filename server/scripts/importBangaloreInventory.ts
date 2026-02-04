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

  // 🔥 HARD RESET (since you are replacing inventory)
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          if (!row.medicine_name || !row.price) return;

          await db.insert(medicines).values({
            name: row.medicine_name.trim(),
            manufacturer: row.manufacturer?.trim() || null,
            genericName: row.composition || null,

            // ✅ FIX: correctly import image URL
            imageUrl:
              row.image_url && row.image_url.trim() !== ""
                ? row.image_url.trim()
                : null,

            price: row.price.toString(),
            mrp: row.price.toString(),
            packSize: row.pack_size?.toString() || "1",
            stock: 100,
            requiresPrescription: row.rx_flag === "true",
            isScheduleH: row.rx_flag === "true",
            categoryId: null, // optional for now
          });

          inserted++;

          if (inserted % 100 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch {
          // skip bad rows silently
        }
      })
      .on("end", () => {
        console.log(`✅ FINAL IMPORT COMPLETE: ${inserted} medicines`);
        resolve();
      })
      .on("error", reject);
  });
}