import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

// 🔥 FIXED: Render runs from /opt/render/project/src
const DATA_DIR = path.join(process.cwd(), "data");
const MAX_MEDICINES = 50_000;

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
  console.log("📁 DATA_DIR resolved to:", DATA_DIR);

  if (!fs.existsSync(DATA_DIR)) {
    console.error("❌ DATA_DIR does not exist:", DATA_DIR);
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".csv.gz"));

  if (files.length === 0) {
    console.error("❌ No .csv.gz file found in", DATA_DIR);
    return;
  }

  const filePath = path.join(DATA_DIR, files[0]);
  console.log("📥 Found CSV:", files[0]);

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

    await db.insert(medicines).values({
      name,
      genericName: row["Composition"] || null,
      manufacturer: extractManufacturer(rawProduct),
      categoryId: defaultCategory.id,
      dosage: null,
      form: null,
      packSize: extractPackSize(rawProduct),
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

  console.log(`✅ CSV import complete: ${inserted} medicines`);
}