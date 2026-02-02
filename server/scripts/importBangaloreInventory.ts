import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

/**
 * CONFIG — SAFE VALUES FOR RENDER FREE
 */
const CSV_PATH = path.join(
  process.cwd(),
  "server",
  "data",
  "bangalore_inventory_45k_master.csv"
);

const BATCH_SIZE = 100; // 🔥 DO NOT INCREASE
const MAX_ROWS = 50_000; // hard safety cap

export async function importBangaloreInventory() {
  console.log("📦 Bangalore inventory import started");

  if (!fs.existsSync(CSV_PATH)) {
    console.error("❌ CSV file not found:", CSV_PATH);
    return;
  }

  console.log("📥 Using CSV:", CSV_PATH);

  // 1️⃣ Clear existing medicines ONLY
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let buffer: any[] = [];
  let inserted = 0;
  let processed = 0;

  return new Promise<void>((resolve, reject) => {
    const stream = fs
      .createReadStream(CSV_PATH)
      .pipe(csv());

    stream.on("data", async (row) => {
      stream.pause(); // ⛔ pause stream while inserting

      try {
        processed++;
        if (processed > MAX_ROWS) {
          console.log("🛑 Reached max row limit, stopping");
          stream.destroy();
          return;
        }

        const name = row["medicine_name"]?.trim();
        const manufacturer = row["manufacturer"]?.trim();
        const price = Number(row["price"]);

        if (!name || !manufacturer || isNaN(price)) {
          stream.resume();
          return;
        }

        buffer.push({
          name,
          manufacturer,
          genericName: row["composition"] || null,
          price: price.toString(),
          mrp: price.toString(),
          packSize: Number(row["pack_size"]) || 1,
          stock: 100,
          requiresPrescription: row["rx_flag"] === "true",
          isScheduleH: row["rx_flag"] === "true",
        });

        if (buffer.length >= BATCH_SIZE) {
          await db.insert(medicines).values(buffer);
          inserted += buffer.length;
          buffer = [];

          if (inserted % 1000 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        }
      } catch (err) {
        console.error("❌ Insert error:", err);
      } finally {
        stream.resume(); // ▶ resume reading
      }
    });

    stream.on("end", async () => {
      try {
        if (buffer.length > 0) {
          await db.insert(medicines).values(buffer);
          inserted += buffer.length;
        }

        console.log(`✅ Import complete: ${inserted} medicines`);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    stream.on("error", (err) => {
      console.error("❌ CSV stream error:", err);
      reject(err);
    });
  });
}

/**
 * Allow direct execution (npm run import:bangalore)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  importBangaloreInventory()
    .then(() => {
      console.log("✅ Admin import finished");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}