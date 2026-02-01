import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const MAX_MEDICINES = 50_000; // safe cap for Render free tier

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (SAFE LIMITED MODE)");

  if (!fs.existsSync(DATA_DIR)) {
    console.warn("⚠️ server/data directory not found, skipping import");
    return;
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".csv") || f.endsWith(".csv.gz"));

  if (files.length === 0) {
    console.warn("⚠️ No CSV files found in server/data, skipping import");
    return;
  }

  const csvFile = files[0];
  const filePath = path.join(DATA_DIR, csvFile);

  console.log("📥 Found CSV file:", csvFile);

  // 🚨 wipe medicines ONLY
  await db.delete(medicines);
  console.log("🧨 Wiped medicines table");

  // categories
  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  categoryRows.forEach((c) =>
    categoryMap.set(c.name.toLowerCase(), c.id)
  );

  const fileStream = fs.createReadStream(filePath);
  const inputStream = csvFile.endsWith(".gz")
    ? fileStream.pipe(zlib.createGunzip())
    : fileStream;

  let inserted = 0;

  return new Promise<void>((resolve, reject) => {
    const parser = csv();

    inputStream
      .pipe(parser)
      .on("data", async (row) => {
        try {
          if (inserted >= MAX_MEDICINES) {
            console.log(`🛑 Reached ${MAX_MEDICINES}, stopping import`);
            parser.destroy();
            return;
          }

          // ✅ CORRECT COLUMN MAPPING (THIS IS THE FIX)
          const name =
            row["Drug_Name"] ||
            row["Brand_Name"] ||
            row["Medicine_Name"];

          if (!name) return;

          const manufacturer =
            row["Manufacturer_Name"] ||
            row["Company_Name"] ||
            null;

          const categoryName =
            row["Therapeutic_Class"] ||
            "General";

          const categoryId =
            categoryMap.get(categoryName.toLowerCase()) ||
            categoryMap.values().next().value;

          await db.insert(medicines).values({
            name: name.trim(),
            genericName: row["Salt_Composition"] || null,
            manufacturer,
            categoryId,
            dosage: row["Strength"] || null,
            form: row["Dosage_Form"] || null,
            packSize: null,
            price: "0",
            mrp: "0",
            stock: 100,
            requiresPrescription: false,
            isScheduleH: false,
          });

          inserted++;

          if (inserted % 1000 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch {
          // silently skip bad rows
        }
      })
      .on("end", () => {
        console.log(`✅ CSV import complete: ${inserted} medicines`);
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ CSV import failed:", err);
        reject(err);
      });
  });
}