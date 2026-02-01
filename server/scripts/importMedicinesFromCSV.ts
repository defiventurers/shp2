import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

/**
 * SAFE CSV IMPORT
 * - DOES NOT delete existing medicines
 * - ONLY inserts new ones
 * - FK-safe for existing orders
 */
export async function importMedicinesFromCSV() {
  console.log("📦 Starting CSV medicine import (SAFE MODE)...");

  const csvPath = path.join(
    process.cwd(),
    "server",
    "data",
    "IndiaMedicinesandDrugInfoDataset.csv.gz.csv.gz"
  );

  if (!fs.existsSync(csvPath)) {
    console.log("⚠️ CSV file not found, skipping import");
    return;
  }

  console.log("📥 Importing medicines from CSV (no deletes)");

  const categoryCache = new Map<string, string>();
  const existingMedicineNames = new Set<string>();

  // Load existing medicine names once
  const existing = await db.query.medicines.findMany({
    columns: { name: true },
  });

  existing.forEach((m) => {
    if (m.name) {
      existingMedicineNames.add(m.name.toLowerCase());
    }
  });

  function normalizePrice(value: any): string {
    const num = Number(value);
    return isNaN(num) ? "0" : num.toFixed(2);
  }

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(zlib.createGunzip())
      .pipe(csv())
      .on("data", async (row) => {
        try {
          const name =
            row["drug_name"] ||
            row["name"] ||
            row["Drug Name"] ||
            null;

          if (!name) return;

          const normalizedName = name.toLowerCase();
          if (existingMedicineNames.has(normalizedName)) {
            return; // skip duplicates
          }

          existingMedicineNames.add(normalizedName);

          const categoryName =
            row["category"] ||
            row["Category"] ||
            "General";

          let categoryId = categoryCache.get(categoryName);

          if (!categoryId) {
            const [cat] = await db
              .insert(categories)
              .values({ name: categoryName })
              .onConflictDoNothing()
              .returning();

            categoryId =
              cat?.id ||
              (
                await db.query.categories.findFirst({
                  where: (c, { eq }) => eq(c.name, categoryName),
                })
              )?.id;

            if (categoryId) {
              categoryCache.set(categoryName, categoryId);
            }
          }

          await db.insert(medicines).values({
            name,
            genericName:
              row["composition"] ||
              row["Composition"] ||
              null,
            manufacturer:
              row["manufacturer"] ||
              row["Manufacturer"] ||
              null,
            dosage:
              row["strength"] ||
              row["Strength"] ||
              null,
            form:
              row["dosage_form"] ||
              row["Form"] ||
              null,
            price: normalizePrice(row["price"] || row["Price"]),
            mrp: normalizePrice(row["price"] || row["Price"]),
            stock: 100,
            requiresPrescription:
              String(row["schedule"] || "")
                .toUpperCase()
                .includes("H"),
            isScheduleH:
              String(row["schedule"] || "")
                .toUpperCase()
                .includes("H"),
            description: row["uses"] || null,
            categoryId,
          });
        } catch (err) {
          console.error("❌ CSV row import failed:", err);
        }
      })
      .on("end", () => {
        console.log("✅ CSV medicine import completed (SAFE)");
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ CSV stream error:", err);
        reject(err);
      });
  });
}