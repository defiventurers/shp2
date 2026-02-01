import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

/**
 * IMPORTANT:
 * Your dataset lives in /data (NOT /server/data)
 */
const DATA_DIR = path.join(process.cwd(), "data");

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (DESTRUCTIVE MODE)");
  console.log("📁 Resolved DATA_DIR:", DATA_DIR);

  if (!fs.existsSync(DATA_DIR)) {
    console.warn("⚠️ data directory not found, skipping import");
    return;
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter(
      (f) => f.endsWith(".csv") || f.endsWith(".csv.gz")
    );

  if (files.length === 0) {
    console.warn("⚠️ No CSV files found in data/, skipping import");
    return;
  }

  const csvFile = files[0];
  const filePath = path.join(DATA_DIR, csvFile);

  console.log("📥 Found CSV file:", csvFile);

  // 🔥 WIPE MEDICINES ONLY (orders & order_items already handled upstream)
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
        } catch {
          // skip bad rows safely
        }
      })
      .on("end", () => {
        console.log(`✅ CSV import complete: ${inserted} medicines`);
        resolve();
      })
      .on("error", reject);
  });
}