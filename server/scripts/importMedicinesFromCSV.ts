import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { ilike } from "drizzle-orm";

const FILE_PATH = path.join(
  process.cwd(),
  "server/data/IndiaMedicinesandDrugInfoDataset.csv.gz"
);

async function run() {
  console.log("🚀 Starting medicines import…");

  let inserted = 0;
  let skipped = 0;

  const stream = fs
    .createReadStream(FILE_PATH)
    .pipe(zlib.createGunzip())
    .pipe(csv());

  for await (const row of stream) {
    const name =
      row["Medicine Name"] ||
      row["Drug Name"] ||
      row["name"];

    if (!name) {
      skipped++;
      continue;
    }

    // 🔁 Check duplicate (case-insensitive)
    const existing = await db.query.medicines.findFirst({
      where: ilike(medicines.name, name.trim()),
    });

    if (existing) {
      skipped++;
      continue;
    }

    const priceRaw =
      row["MRP"] ||
      row["Price"] ||
      row["mrp"] ||
      "0";

    const price = Number(
      String(priceRaw).replace(/[^\d.]/g, "")
    );

    await db.insert(medicines).values({
      name: name.trim(),
      genericName: row["Generic Name"] || null,
      manufacturer: row["Manufacturer"] || null,
      form: row["Dosage Form"] || null,
      dosage: row["Strength"] || null,
      price: price || 0,
      mrp: price || 0,
      stock: 100,
      requiresPrescription:
        String(row["Prescription Required"] || "")
          .toLowerCase()
          .includes("yes"),
      isScheduleH:
        String(row["Schedule"] || "")
          .toUpperCase()
          .includes("H"),
    });

    inserted++;

    if (inserted % 500 === 0) {
      console.log(`✅ Inserted ${inserted} medicines…`);
    }
  }

  console.log("🎉 Import completed");
  console.log("Inserted:", inserted);
  console.log("Skipped (duplicates / invalid):", skipped);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
