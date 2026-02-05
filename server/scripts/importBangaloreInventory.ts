import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

/**
 * Normalizes CSV headers safely
 */
function normalizeKey(key: string) {
  return key
    .replace(/\uFEFF/g, "")      // remove BOM
    .replace(/\u00A0/g, " ")     // non-breaking space
    .trim()
    .toLowerCase();
}

export async function importBangaloreInventory() {
  console.log("📦 Starting inventory import");

  const csvPath = path.join(
    process.cwd(),
    "server",
    "data",
    "easyload_inventory.csv"
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found at ${csvPath}`);
  }

  // Load categories once
  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map(
    categoryRows.map(c => [c.name.toUpperCase(), c.id])
  );

  let inserted = 0;
  let skipped = 0;

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  const batch: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (rawRow) => {
        try {
          // 🔑 Normalize row keys
          const row: Record<string, string> = {};
          for (const key of Object.keys(rawRow)) {
            row[normalizeKey(key)] = rawRow[key];
          }

          const name = row["medicine name"];
          const priceRaw = row["price"];
          const packSizeRaw = row["pack-size"];
          const manufacturer = row["manufacturer"];
          const imageUrl = row["image url"];
          const rxRaw = row["is prescription required?"];
          const categoryName = row["category"];

          if (!name || !priceRaw || !categoryName) {
            skipped++;
            return;
          }

          const price = Number(priceRaw);
          if (Number.isNaN(price)) {
            skipped++;
            return;
          }

          const packSize = Number(packSizeRaw ?? 0);
          const requiresPrescription =
            rxRaw?.toLowerCase() === "yes" ||
            rxRaw?.toLowerCase() === "true";

          const categoryId = categoryMap.get(categoryName.toUpperCase()) ?? null;

          batch.push({
            name: name.trim(),
            price,
            mrp: price,
            packSize,
            manufacturer: manufacturer || "Not Known",
            imageUrl: imageUrl || null,
            requiresPrescription,
            isScheduleH: requiresPrescription,
            categoryId,
            sourceFile: "easyload_inventory.csv",
          });

          inserted++;

          if (batch.length === 500) {
            db.insert(medicines).values(batch.splice(0));
            if (inserted % 1000 === 0) {
              console.log(`➕ Inserted ${inserted}`);
            }
          }
        } catch (err) {
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