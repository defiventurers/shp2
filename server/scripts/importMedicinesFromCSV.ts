import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const MAX_MEDICINES = 50_000; // safe for Render free tier

function extractName(product: string) {
  return product.split("MRP")[0].trim();
}

function extractManufacturer(product: string) {
  const parts = product.split("\n").map(p => p.trim());
  return parts.find(p => /Ltd|Pharma|Healthcare|Laboratories/i.test(p)) || null;
}

function extractPackSize(product: string) {
  const match = product.match(/strip of .*? tablets/i);
  return match ? match[0] : null;
}

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (SAFE MODE)");

  if (!fs.existsSync(DATA_DIR)) {
    console.error("❌ server/data directory NOT FOUND");
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".csv.gz"));
  if (files.length === 0) {
    console.error("❌ No CSV.gz file found");
    return;
  }

  const filePath = path.join(DATA_DIR, files[0]);
  console.log("📥 Importing:", files[0]);

  // wipe medicines only
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  const [defaultCategory] = await db.select().from(categories).limit(1);
  if (!defaultCategory) {
    console.error("❌ No categories found");
    return;
  }

  let inserted = 0;

  const stream = fs
    .createReadStream(filePath)
    .pipe(zlib.createGunzip())
    .pipe(csv());

  for await (const row of stream) {
    if (inserted >= MAX_MEDICINES) break;

    const rawProduct = row["Product Name"];
    if (!rawProduct) continue;

    const name = extractName(rawProduct);
    if (!name || name.length > 120) continue;

    const manufacturer = extractManufacturer(rawProduct);
    const packSize = extractPackSize(rawProduct);

    await db.insert(medicines).values({
      name,
      genericName: row["Composition"] || null,
      manufacturer,
      categoryId: defaultCategory.id,
      dosage: null,
      form: null,
      packSize,
      price: "0",
      mrp: "0",
      stock: 100,
      requiresPrescription: rawProduct.includes("Prescription Required"),
      isScheduleH: rawProduct.includes("Prescription Required"),
    });

    inserted++;
    if (inserted % 1000 === 0) {
      console.log(`➕ Inserted ${inserted} medicines`);
    }
  }

  console.log(`✅ Import complete: ${inserted} medicines`);
}