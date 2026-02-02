import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

/**
 * Bangalore-only inventory importer
 * FULL REPLACEMENT of medicines table
 */

const DATA_DIR = path.join(process.cwd(), "server", "data");
const CSV_FILE = "bangalore_inventory_45k_master.csv"; // 🔥 EXACT FILE
const MAX_ROWS = 46000; // hard safety cap

export async function importMedicinesFromCSV() {
  console.log("📦 Starting Bangalore inventory import");

  const csvPath = path.join(DATA_DIR, CSV_FILE);

  if (!fs.existsSync(csvPath)) {
    console.error("❌ CSV file NOT FOUND:", csvPath);
    return;
  }

  /* -----------------------------
     FULL REPLACEMENT (SAFE)
  ------------------------------ */
  console.log("🧨 Clearing existing medicines...");
  await db.delete(medicines);

  const stream = fs.createReadStream(csvPath);

  let inputStream: NodeJS.ReadableStream = stream;

  if (CSV_FILE.endsWith(".gz")) {
    inputStream = stream.pipe(zlib.createGunzip());
  }

  let inserted = 0;
  const seen = new Set<string>(); // (name + manufacturer) uniqueness

  return new Promise<void>((resolve, reject) => {
    inputStream
      .pipe(csv())
      .on("data", async (row) => {
        try {
          if (inserted >= MAX_ROWS) return;

          const name = row["medicine_name"]?.trim();
          const priceRaw = row["price"];

          if (!name || !priceRaw) return;

          const manufacturer =
            row["manufacturer"]?.trim() || "Unknown";

          const uniqueKey = `${name.toLowerCase()}::${manufacturer.toLowerCase()}`;
          if (seen.has(uniqueKey)) return;
          seen.add(uniqueKey);

          const price = Number(priceRaw);
          if (Number.isNaN(price)) return;

          await db.insert(medicines).values({
            name,
            manufacturer,
            genericName: row["composition"] || null,
            price: price.toFixed(2),
            mrp: price.toFixed(2),
            packSize: row["pack_size"]
              ? Number(row["pack_size"])
              : null,
            stock: 999,

            // 🔑 FLAGS DRIVE APP LOGIC
            requiresPrescription: row["rx_flag"] === "true",
            isScheduleH: row["rx_flag"] === "true",
            isAyurvedic: row["ayurvedic_flag"] === "true",
          });

          inserted++;

          if (inserted % 1000 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch {
          // skip bad rows safely
        }
      })
      .on("end", () => {
        console.log(`✅ Import complete: ${inserted} medicines`);
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ Import failed:", err);
        reject(err);
      });
  });
}