import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const CSV_FILE = "IndiaMedicinesandDrugInfoDataset.csv.gz.csv.gz";

export async function importMedicinesFromCSV() {
  const filePath = path.join(DATA_DIR, CSV_FILE);

  console.log("📦 Starting CSV medicine import (DESTRUCTIVE MODE)");

  if (!fs.existsSync(filePath)) {
    console.warn("⚠️ CSV file not found, skipping import");
    return;
  }

  // 🔥 CLEAR DB SAFELY (ORDER IS IMPORTANT)
  await db.delete(medicines);
  console.log("🧨 Wiped medicines table");

  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  categoryRows.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));

  console.log("📥 Reading CSV file:", CSV_FILE);

  const stream = fs.createReadStream(filePath);

  // 🧠 Detect gzip safely
  let inputStream: NodeJS.ReadableStream;

  if (filePath.endsWith(".gz")) {
    console.log("🧪 Attempting gzip decompression...");
    inputStream = stream.pipe(zlib.createGunzip());
  } else {
    console.log("🧪 Treating file as plain CSV");
    inputStream = stream;
  }

  let inserted = 0;

  try {
    await new Promise<void>((resolve, reject) => {
      inputStream
        .pipe(csv())
        .on("data", async (row) => {
          try {
            const name =
              row["Medicine Name"] ||
              row["Drug Name"] ||
              row["name"];

            if (!name) return;

            const categoryName =
              row["Therapeutic Class"] ||
              row["Category"] ||
              "Pain Relief";

            const categoryId =
              categoryMap.get(categoryName.toLowerCase()) ||
              categoryMap.values().next().value;

            await db.insert(medicines).values({
              name: name.trim(),
              genericName: row["Generic Name"] || null,
              manufacturer: row["Manufacturer"] || null,
              categoryId,
              dosage: row["Dosage"] || null,
              form: row["Form"] || null,
              packSize: row["Pack Size"] || null,
              price: "0",
              mrp: "0",
              stock: 100,
              requiresPrescription:
                row["Prescription Required"] === "Yes",
              isScheduleH:
                row["Schedule H"] === "Yes",
            });

            inserted++;
          } catch (e) {
            // skip bad rows silently
          }
        })
        .on("end", () => {
          console.log(`✅ CSV import complete: ${inserted} medicines`);
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  } catch (err) {
    console.error("❌ CSV import failed:", err);
  }
}