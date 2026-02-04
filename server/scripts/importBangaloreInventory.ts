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
    throw new Error(`CSV not found: ${CSV_PATH}`);
  }

  // 🔁 Load categories → map name → id
  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map(
    categoryRows.map((c) => [c.name.toUpperCase(), c.id])
  );

  // 🔥 Hard reset medicines
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;
  let skipped = 0;

  const batch: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        try {
          const name = row["Medicine Name"]?.trim();
          if (!name) {
            skipped++;
            return;
          }

          const price = Number(row["Price"]);
          if (!Number.isFinite(price)) {
            skipped++;
            return;
          }

          const packSize = Number(row["Pack-Size"]);
          if (!Number.isFinite(packSize)) {
            skipped++;
            return;
          }

          const rxRaw = row["Is Prescription Required?"]
            ?.toString()
            .toLowerCase();

          const requiresRx =
            rxRaw === "yes" || rxRaw === "true" || rxRaw === "1";

          const categoryName = row["Category"]?.toUpperCase();
          const categoryId = categoryMap.get(categoryName) || null;

          batch.push({
            name,
            manufacturer: row["Manufacturer"] || "Not Known",
            packSize,
            price,
            mrp: price,
            requiresPrescription: requiresRx,
            isScheduleH: requiresRx,
            imageUrl: row["Image URL"] || null,
            categoryId,
            sourceFile: "easyload_inventory.csv",
          });

          inserted++;

          if (batch.length === 500) {
            db.insert(medicines)
              .values(batch.splice(0))
              .catch(reject);
            console.log(`➕ Inserted ${inserted}`);
          }
        } catch {
          skipped++;
        }
      })
      .on("end", async () => {
        if (batch.length) {
          await db.insert(medicines).values(batch);
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