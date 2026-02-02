import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const MAX_MEDICINES = 45_000; // Bangalore-optimized cap

export async function importMedicinesFromCSV() {
  console.log("📦 Bangalore inventory import started");

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

  console.log("📥 Using CSV:", csvFile);

  /* -----------------------------
     CLEAR EXISTING MEDICINES
  ------------------------------ */
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  /* -----------------------------
     CATEGORY MAP
  ------------------------------ */
  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  categoryRows.forEach((c) =>
    categoryMap.set(c.name.toLowerCase(), c.id)
  );

  /* -----------------------------
     STREAM SETUP (CRITICAL FIX)
  ------------------------------ */
  const fileStream = fs.createReadStream(filePath);

  const inputStream = csvFile.endsWith(".gz")
    ? fileStream.pipe(zlib.createGunzip())
    : fileStream; // ✅ PLAIN CSV — NO GUNZIP

  let inserted = 0;

  return new Promise<void>((resolve, reject) => {
    const parser = csv();

    inputStream
      .pipe(parser)
      .on("data", async (row) => {
        try {
          if (inserted >= MAX_MEDICINES) {
            console.log(`🛑 Reached ${MAX_MEDICINES} medicines, stopping import`);
            parser.destroy();
            return;
          }

          const name = row["medicine_name"];
          const manufacturer = row["manufacturer"];
          const price = row["price"];

          if (!name || !price) return;

          const composition = row["composition"] || null;
          const packSize = row["pack_size"]
            ? Number(row["pack_size"])
            : null;

          const rxFlag = row["rx_flag"] === "true";
          const otcFlag = row["otc_flag"] === "true";
          const ayurvedicFlag = row["ayurvedic_flag"] === "true";

          // Category routing
          let categoryName = "Prescription";
          if (otcFlag) categoryName = "OTC";
          if (ayurvedicFlag) categoryName = "Ayurvedic";

          const categoryId =
            categoryMap.get(categoryName.toLowerCase()) ||
            categoryMap.values().next().value;

          await db.insert(medicines).values({
            name: name.trim(),
            genericName: composition,
            manufacturer,
            categoryId,
            packSize: packSize?.toString() ?? null,
            price: price.toString(),
            mrp: price.toString(),
            stock: 100,
            requiresPrescription: rxFlag,
            isScheduleH: rxFlag,
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
        console.error("❌ CSV parsing failed:", err);
        reject(err);
      });
  });
}