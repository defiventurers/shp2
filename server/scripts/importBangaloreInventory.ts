import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const FILE_NAME = "bangalore_inventory_45k_master.csv";

// SAFE LIMITS FOR RENDER FREE
const BATCH_SIZE = 9000;

export async function importMedicinesFromCSV() {
  const offset = Number(process.env.IMPORT_OFFSET || 0);

  const filePath = path.join(DATA_DIR, FILE_NAME);

  console.log("📦 Starting Bangalore inventory import");
  console.log("📥 Using CSV:", FILE_NAME);
  console.log("➡️ IMPORT_OFFSET:", offset);

  if (!fs.existsSync(filePath)) {
    console.error("❌ CSV file not found:", filePath);
    return;
  }

  // 🔥 ONLY CLEAR TABLE ON FIRST BATCH
  if (offset === 0) {
    console.log("🧨 Clearing existing medicines...");
    await db.delete(medicines);
  }

  let seen = 0;
  let inserted = 0;
  let skipped = 0;

  return new Promise<void>((resolve, reject) => {
    const stream = fs
      .createReadStream(filePath)
      .pipe(csv());

    stream.on("data", async (row) => {
      try {
        seen++;

        // Skip until offset
        if (seen <= offset) return;

        // Stop after batch
        if (inserted >= BATCH_SIZE) {
          console.log("🛑 Batch limit reached, stopping stream");
          stream.destroy();
          return;
        }

        const medicineName = row["medicine_name"]?.trim();
        const manufacturer = row["manufacturer"]?.trim();
        const price = Number(row["price"]);

        if (!medicineName || !manufacturer || !price) {
          skipped++;
          return;
        }

        await db.insert(medicines).values({
          name: medicineName,
          manufacturer,
          genericName: row["composition"] || null,
          price: price.toString(),
          mrp: price.toString(),
          packSize: row["pack_size"] || null,
          stock: 100,
          requiresPrescription: row["rx_flag"] === "true",
          isScheduleH: row["rx_flag"] === "true",
          isAyurvedic: row["ayurvedic_flag"] === "true",
        });

        inserted++;

        if (inserted % 1000 === 0) {
          console.log(`➕ Inserted ${inserted} medicines`);
        }
      } catch {
        skipped++;
      }
    });

    stream.on("end", () => {
      console.log("✅ Batch complete");
      console.log("📊 Inserted:", inserted);
      console.log("⚠️ Skipped:", skipped);
      resolve();
    });

    stream.on("error", (err) => {
      console.error("❌ CSV import failed:", err);
      reject(err);
    });
  });
}