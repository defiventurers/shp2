import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const MAX_MEDICINES = 50_000;

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (SAFE LIMITED MODE)");
  console.log("📁 DATA_DIR resolved to:", DATA_DIR);

  if (!fs.existsSync(DATA_DIR)) {
    console.error("❌ server/data directory NOT FOUND");
    return;
  }

  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".csv") || f.endsWith(".csv.gz"));

  if (files.length === 0) {
    console.error("❌ No CSV files found in server/data");
    return;
  }

  const csvFile = files[0];
  const filePath = path.join(DATA_DIR, csvFile);

  console.log("📥 Found CSV file:", csvFile);

  // Wipe medicines only (safe)
  await db.delete(medicines);
  console.log("🧨 Wiped medicines table");

  const categoryRows = await db.select().from(categories);
  const defaultCategoryId = categoryRows[0]?.id;

  if (!defaultCategoryId) {
    console.error("❌ No categories found — aborting import");
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const inputStream = csvFile.endsWith(".gz")
    ? fileStream.pipe(zlib.createGunzip())
    : fileStream;

  let inserted = 0;
  let loggedHeaders = false;

  return new Promise<void>((resolve, reject) => {
    const parser = csv();

    inputStream
      .pipe(parser)
      .on("data", async (row) => {
        try {
          if (!loggedHeaders) {
            console.log("🧾 CSV HEADERS:", Object.keys(row));
            loggedHeaders = true;
          }

          if (inserted >= MAX_MEDICINES) {
            console.log(`🛑 Reached ${MAX_MEDICINES} medicines, stopping`);
            parser.destroy();
            return;
          }

          // 🔑 FLEXIBLE FIELD MAPPING
          const name =
            row["medicine_name"] ||
            row["drug_name"] ||
            row["brand_name"] ||
            row["Medicine Name"] ||
            row["Drug Name"];

          if (!name) return;

          const manufacturer =
            row["manufacturer_name"] ||
            row["Manufacturer"] ||
            row["Company"] ||
            null;

          const dosage =
            row["strength"] ||
            row["dosage"] ||
            row["Dosage"] ||
            null;

          const form =
            row["dosage_form"] ||
            row["Form"] ||
            null;

          const schedule =
            row["schedule"] ||
            row["Schedule"] ||
            "";

          await db.insert(medicines).values({
            name: String(name).trim(),
            genericName: row["composition"] || null,
            manufacturer,
            categoryId: defaultCategoryId,
            dosage,
            form,
            packSize: null,
            price: "0",
            mrp: "0",
            stock: 100,
            requiresPrescription: schedule.includes("H"),
            isScheduleH: schedule.includes("H"),
          });

          inserted++;

          if (inserted % 1000 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch (err) {
          // skip bad rows safely
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