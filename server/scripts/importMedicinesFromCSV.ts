import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories, orderItems, orders } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * ⚠️ DESTRUCTIVE CSV IMPORT
 * This will WIPE orders, order_items, and medicines
 * and replace them with CSV data.
 *
 * ENABLE ONLY ONCE.
 */
const ENABLE_DESTRUCTIVE_RESET = true;

/**
 * Path to compressed CSV
 * (relative to project root)
 */
const CSV_PATH = path.resolve(
  process.cwd(),
  "server/data/IndiaMedicinesandDrugInfoDataset.csv.gz"
);

export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (DESTRUCTIVE MODE)");

  if (!ENABLE_DESTRUCTIVE_RESET) {
    console.log("⏭️ Destructive reset disabled, skipping import");
    return;
  }

  if (!fs.existsSync(CSV_PATH)) {
    console.log("⚠️ CSV file not found, skipping import");
    return;
  }

  /* =========================
     STEP 1 — WIPE DATA (ORDER)
  ========================= */
  console.log("🧨 Wiping order_items...");
  await db.delete(orderItems);

  console.log("🧨 Wiping orders...");
  await db.delete(orders);

  console.log("🧨 Wiping medicines...");
  await db.delete(medicines);

  console.log("🧨 Wiping categories...");
  await db.delete(categories);

  /* =========================
     STEP 2 — LOAD CSV
  ========================= */
  const rows: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(zlib.createGunzip())
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`📄 Parsed ${rows.length} CSV rows`);

  /* =========================
     STEP 3 — CATEGORY MAP
  ========================= */
  const categoryMap = new Map<string, string>();

  async function getCategoryId(name: string) {
    if (!name) return null;

    if (categoryMap.has(name)) {
      return categoryMap.get(name)!;
    }

    const [created] = await db
      .insert(categories)
      .values({ name })
      .returning();

    categoryMap.set(name, created.id);
    return created.id;
  }

  /* =========================
     STEP 4 — INSERT MEDICINES
  ========================= */
  let inserted = 0;

  for (const row of rows) {
    const name = row.drug_name?.trim();
    if (!name) continue;

    const categoryId = await getCategoryId(
      row.category?.trim() || "General"
    );

    const schedule = String(row.schedule || "").toUpperCase();

    await db.insert(medicines).values({
      name,
      genericName: row.composition || null,
      manufacturer: row.manufacturer || null,
      dosage: row.strength || null,
      form: row.dosage_form || null,
      description: row.uses || null,

      price: Number(row.price) || 0,
      mrp: Number(row.price) || 0,
      stock: 100,

      requiresPrescription: schedule.includes("H"),
      isScheduleH: schedule.includes("H"),

      categoryId,
    });

    inserted++;
  }

  console.log(`✅ Imported ${inserted} medicines from CSV`);
}