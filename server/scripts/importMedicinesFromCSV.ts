import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

/**
 * ✅ CORRECT DATA DIRECTORY
 * Repo structure:
 * /data/IndiaMedicinesandDrugInfoDataset.csv.gz
 */
const DATA_DIR = path.join(process.cwd(), "data");

/**
 * 🔥 HARD SAFETY CAP
 * Render Free cannot handle more safely
 */
const MAX_MEDICINES = 50_000;

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (SAFE LIMITED MODE)");
  console.log("📁 Resolved DATA_DIR:", DATA_DIR);

  if (!fs.existsSync(DATA_DIR)) {
    console.warn("⚠️ data directory not found, skipping import");
    return;
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".csv") || f.endsWith(".csv.gz"));

  if (files.length === 0) {
    console.warn("⚠️ No CSV files found in data/, skipping import");
    return;
  }

  const csvFile = files[0];
  const filePath = path.join(DATA_DIR, csvFile);

  console.log("📥 Found CSV file:", csvFile);

  // ⚠️ WIPE ONLY medicines (SAFE)
  await db.delete(medicines);
  console.log("🧨 Wiped medicines table");

  // Load categories
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
  let stoppedEarly = false;

  return new Promise<void>((resolve, reject) => {
    const parser = csv();

    inputStream
      .pipe(parser)
      .on("data", async (row) => {
        try {
          if (inserted >= MAX_MEDICINES) {
            if (!stoppedEarly) {
              console.log(
                `🛑 Reached ${MAX_MEDICINES} medicines — stopping import`
              );
              stoppedEarly = true;
              parser.destroy(); // stop stream cleanly
            }
            return;
          }

          const name =
            row["Medicine Name"] ||
            row["Drug Name"] ||
            row["name"];

          const manufacturer =
            row["Manufacturer"] ||
            row["Company"] ||
            null;

          if (!name || !manufacturer) return;
          if (name.length > 80) return;

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
            manufacturer,
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

          if (inserted % 5000 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch {
          // silently skip malformed rows
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