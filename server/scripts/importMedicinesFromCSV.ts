import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

/**
 * 🚨 DO NOT USE process.cwd()
 * Render runs tsx from different working dirs.
 * We resolve from THIS FILE instead.
 *
 * server/scripts → ../../data
 */
const DATA_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../data"
);

const MAX_MEDICINES = 50_000;

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (SAFE LIMITED MODE)");
  console.log("📁 DATA_DIR resolved to:", DATA_DIR);

  if (!fs.existsSync(DATA_DIR)) {
    console.error("❌ data directory NOT FOUND");
    return;
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".csv") || f.endsWith(".csv.gz"));

  if (files.length === 0) {
    console.error("❌ No CSV files found in /data");
    return;
  }

  const csvFile = files[0];
  const filePath = path.join(DATA_DIR, csvFile);

  console.log("📥 Using CSV file:", filePath);

  // ⚠️ wipe ONLY medicines
  await db.delete(medicines);
  console.log("🧨 Wiped medicines table");

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
            row["Therapeutic_Class"] || "General";

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
          // skip bad rows
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