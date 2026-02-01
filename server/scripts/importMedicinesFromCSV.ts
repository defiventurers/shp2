import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

const CSV_PATH = path.resolve(
  process.cwd(),
  "server/data/India Medicines and Drug Info Dataset.csv"
);

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import...");

  if (!fs.existsSync(CSV_PATH)) {
    console.warn("⚠️ CSV file not found, skipping import");
    return;
  }

  const rows: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", resolve)
      .on("error", reject);
  });

  if (rows.length === 0) {
    console.log("⚠️ CSV empty, nothing to import");
    return;
  }

  console.log(`📄 Parsed ${rows.length} medicines`);

  // ⚠️ Minimal safe mapping — adjust later if needed
  for (const row of rows.slice(0, 5000)) {
    try {
      await db.insert(medicines).values({
        name: row["Drug Name"] || row["Medicine Name"],
        manufacturer: row["Manufacturer"] || null,
        genericName: row["Generic Name"] || null,
        price: row["Price"] ? String(row["Price"]) : "0",
        mrp: row["MRP"] ? String(row["MRP"]) : "0",
        stock: 100,
        requiresPrescription: true,
      });
    } catch {
      // ignore duplicates
    }
  }

  console.log("✅ Medicine import completed");
}