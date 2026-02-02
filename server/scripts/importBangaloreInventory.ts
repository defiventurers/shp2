import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const FILE_NAME = "bangalore_inventory_45k_master.csv";
const BATCH_SIZE = 100;

async function run() {
  console.log("📦 Bangalore inventory import started");

  const filePath = path.join(DATA_DIR, FILE_NAME);

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV not found: ${filePath}`);
  }

  console.log("📥 Using CSV:", FILE_NAME);

  // FULL REPLACEMENT
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  categoryRows.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

  const ayurvedicCategoryId =
    categoryMap.get("ayurvedic") ||
    categoryMap.values().next().value;

  let batch: any[] = [];
  let inserted = 0;
  const seen = new Set<string>();

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          const name = row.medicine_name?.trim();
          const manufacturer = row.manufacturer?.trim();
          const price = Number(row.price);

          if (!name || !manufacturer || isNaN(price)) return;

          const key = `${name.toLowerCase()}|${manufacturer.toLowerCase()}`;
          if (seen.has(key)) return;
          seen.add(key);

          batch.push({
            name,
            manufacturer,
            genericName: row.composition || null,
            mrp: price.toString(),
            price: price.toString(),
            packSize: row.pack_size || null,
            stock: 100,
            requiresPrescription: row.rx_flag === "true",
            categoryId: row.ayurvedic_flag === "true"
              ? ayurvedicCategoryId
              : categoryMap.values().next().value,
          });

          if (batch.length >= BATCH_SIZE) {
            await db.insert(medicines).values(batch);
            inserted += batch.length;
            batch = [];

            if (inserted % 5000 === 0) {
              console.log(`➕ Inserted ${inserted} medicines`);
            }
          }
        } catch {
          // ignore bad row
        }
      })
      .on("end", async () => {
        if (batch.length) {
          await db.insert(medicines).values(batch);
          inserted += batch.length;
        }

        console.log(`✅ IMPORT COMPLETE: ${inserted} medicines`);
        resolve();
      })
      .on("error", reject);
  });
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Import failed:", err);
    process.exit(1);
  });