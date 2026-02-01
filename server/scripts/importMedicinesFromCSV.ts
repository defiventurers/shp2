import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "data");
const BATCH_SIZE = 500;

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (SAFE BATCH MODE)");
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

  // ⚠️ WIPE MEDICINES ONLY (orders already handled)
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

  let batch: any[] = [];
  let inserted = 0;
  let paused = false;

  await new Promise<void>((resolve, reject) => {
    const stream = inputStream.pipe(csv());

    const flushBatch = async () => {
      if (batch.length === 0) return;

      await db.insert(medicines).values(batch);
      inserted += batch.length;
      console.log(`➕ Inserted ${inserted} medicines`);
      batch = [];
    };

    stream.on("data", async (row) => {
      stream.pause();
      paused = true;

      try {
        const name =
          row["Medicine Name"] ||
          row["Drug Name"] ||
          row["name"];

        if (!name) {
          stream.resume();
          paused = false;
          return;
        }

        const categoryName =
          row["Therapeutic Class"] ||
          row["Category"] ||
          "Pain Relief";

        const categoryId =
          categoryMap.get(categoryName.toLowerCase()) ||
          categoryMap.values().next().value;

        batch.push({
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

        if (batch.length >= BATCH_SIZE) {
          await flushBatch();
        }
      } catch {
        // ignore bad rows
      } finally {
        stream.resume();
        paused = false;
      }
    });

    stream.on("end", async () => {
      if (paused) return;
      await flushBatch();
      console.log(`✅ CSV import complete: ${inserted} medicines`);
      resolve();
    });

    stream.on("error", reject);
  });
}