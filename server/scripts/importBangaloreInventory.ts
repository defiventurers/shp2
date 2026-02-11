import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const SOURCE_TO_CATEGORY: Record<string, string> = {
  TABLETS: "TABLETS",
  CAPSULES: "CAPSULES",
  SYRUPS: "SYRUPS",
  INJECTIONS: "INJECTIONS",
  "DIABETIC INJECTIONS": "INJECTIONS",
  TOPICALS: "TOPICALS",
  DROPS: "DROPS",
  POWDERS: "POWDERS",
  MOUTHWASH: "MOUTHWASH",
  INHALERS: "INHALERS",
  DEVICES: "DEVICES",
  SCRUBS: "SCRUBS",
  SOLUTIONS: "SOLUTIONS",
  OTHERS: "NO CATEGORY",
  "NO CATEGORY": "NO CATEGORY",
};

export async function importBangaloreInventory() {
  console.log("📦 Starting inventory import");

  const csvPath = path.join(process.cwd(), "server", "data", "easyload_inventory.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error("CSV not found");
  }

  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map(categoryRows.map((c) => [c.name.toUpperCase(), c.id]));

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
          const rawPrice = row["Price"]?.replace(/[^\d.]/g, "");
          const price = Number(rawPrice);
          const packSize = Number(row["Pack-Size"]);
          const manufacturer = row["Manufacturer"]?.trim() || "Not Known";
          const imageUrl = row["Image URL"]?.trim() || null;
          const sourceFile = (row["Source File"] || "Others").trim();
          const normalizedSource = sourceFile.toUpperCase();
          const categoryName = SOURCE_TO_CATEGORY[normalizedSource] || "NO CATEGORY";
          const isRx = String(row["Is Prescription Required?"] || "").trim() === "1";

          if (!name || Number.isNaN(price)) {
            skipped++;
            return;
          }

          const categoryId = categoryMap.get(categoryName) ?? null;

          batch.push({
            name,
            price: price.toFixed(2),
            mrp: price.toFixed(2),
            packSize: Number.isNaN(packSize) ? 0 : packSize,
            manufacturer,
            imageUrl,
            requiresPrescription: isRx,
            categoryId,
            sourceFile,
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
        console.log("🎯 Expected total: ~18433");

        resolve();
      })
      .on("error", reject);
  });
}
