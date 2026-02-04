import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const CSV_PATH = path.join(
  process.cwd(),
  "server",
  "data",
  "easyload_inventory.csv"
);

export async function importBangaloreInventory() {
  console.log("📦 Starting inventory import");

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found at ${CSV_PATH}`);
  }

  // 🔑 Build category name → id map
  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map(
    categoryRows.map((c) => [c.name, c.id])
  );

  let inserted = 0;
  let skipped = 0;
  const batch: any[] = [];

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          const name = row["Medicine Name"];
          const price = Number(row["Price"]);
          const rx =
            String(row["Is Prescription Required?"]).toLowerCase() === "yes" ||
            String(row["Is Prescription Required?"]).toLowerCase() === "true";

          const packSize = Number(row["Pack-Size"]);
          const manufacturer = row["Manufacturer"];
          const imageUrl = row["Image URL"];
          const categoryName = row["Category"];

          const categoryId = categoryMap.get(categoryName);

          if (!name || !categoryId || Number.isNaN(price)) {
            skipped++;
            return;
          }

          batch.push({
            name,
            manufacturer,
            price,
            mrp: price,
            packSize: packSize.toString(),
            stock: null,
            requiresPrescription: rx,
            isScheduleH: rx,
            imageUrl,
            categoryId,
          });

          if (batch.length === 500) {
            await db.insert(medicines).values(batch.splice(0));
            inserted += 500;
            console.log(`➕ Inserted ${inserted}`);
          }
        } catch {
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
        console.log(`🎯 Expected total: 18433`);
        resolve();
      })
      .on("error", reject);
  });
}