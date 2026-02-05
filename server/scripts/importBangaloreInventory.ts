import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

export async function importBangaloreInventory() {
  console.log("📦 Starting inventory import");

  const csvPath = path.join(
    process.cwd(),
    "server",
    "data",
    "easyload_inventory.csv"
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error("CSV not found");
  }

  // 🔑 Build category lookup
  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map(
    categoryRows.map((c) => [c.name.toUpperCase(), c.id])
  );

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;
  let skipped = 0;
  const batch: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          const name = row["Medicine Name"]?.trim();
          const price = Number(row["Price"]);
          const packSize = Number(row["Pack-Size"]);
          const manufacturer = row["Manufacturer"]?.trim() || "Not Known";
          const imageUrl = row["Image URL"]?.trim();
          const categoryName = row["Category"]?.trim().toUpperCase();
          const isRx =
            row["Is Prescription Required?"]?.toLowerCase() === "yes";

          if (!name || Number.isNaN(price)) {
            skipped++;
            return;
          }

          const categoryId = categoryMap.get(categoryName) ?? null;

          batch.push({
            name,
            price,
            mrp: price,
            packSize: packSize || 0,
            manufacturer,
            imageUrl,
            requiresPrescription: isRx,
            isScheduleH: isRx,
            categoryId,
            sourceFile: "easyload_inventory.csv",
          });

          inserted++;

          if (batch.length === 500) {
            db.insert(medicines).values(batch.splice(0)).catch(reject);
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