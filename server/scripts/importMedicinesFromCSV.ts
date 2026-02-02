import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const CSV_FILE = "bangalore_inventory_45k_master.csv";
const BATCH_SIZE = 500; // 🔒 SAFE FOR RENDER
const MAX_MEDICINES = 45_000;

async function run() {
  console.log("📦 Bangalore inventory import started");

  const filePath = path.join(DATA_DIR, CSV_FILE);

  if (!fs.existsSync(filePath)) {
    console.error("❌ CSV file NOT FOUND:", filePath);
    process.exit(1);
  }

  console.log("📥 Using CSV:", CSV_FILE);

  // Clear medicines ONLY
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  categoryRows.forEach(c =>
    categoryMap.set(c.name.toLowerCase(), c.id)
  );

  const buffer: any[] = [];
  let inserted = 0;

  const stream = fs
    .createReadStream(filePath)
    .pipe(zlib.createGunzip())
    .pipe(csv());

  for await (const row of stream) {
    if (inserted >= MAX_MEDICINES) break;

    const name = row.medicine_name?.trim();
    const manufacturer = row.manufacturer?.trim();
    const price = Number(row.price);

    if (!name || !manufacturer || !price) continue;

    buffer.push({
      name,
      manufacturer,
      genericName: row.composition || null,
      categoryId:
        categoryMap.get(
          row.ayurvedic_flag === "true"
            ? "ayurvedic"
            : row.rx_flag === "true"
            ? "prescription"
            : "otc"
        ) ?? categoryRows[0].id,
      dosage: null,
      form: null,
      packSize: Number(row.pack_size) || null,
      price: price.toString(),
      mrp: price.toString(),
      stock: 100,
      requiresPrescription: row.rx_flag === "true",
      isScheduleH: row.rx_flag === "true",
    });

    if (buffer.length >= BATCH_SIZE) {
      await db.insert(medicines).values(buffer);
      inserted += buffer.length;
      buffer.length = 0;

      if (inserted % 5000 === 0) {
        console.log(`➕ Inserted ${inserted} medicines`);
      }
    }
  }

  if (buffer.length) {
    await db.insert(medicines).values(buffer);
    inserted += buffer.length;
  }

  console.log(`✅ Import complete: ${inserted} medicines`);
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});