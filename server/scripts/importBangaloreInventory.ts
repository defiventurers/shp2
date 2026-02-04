import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const CSV_PATH = path.join(
  process.cwd(),
  "server",
  "data",
  "easyload_inventory.csv"
);

function normalizeKey(key: string) {
  return key.replace(/\ufeff/g, "").trim().toLowerCase();
}

export async function importBangaloreInventory() {
  console.log("📦 Starting inventory import");
  console.log("📍 CSV PATH:", CSV_PATH);

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error("CSV file not found");
  }

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map(
    categoryRows.map((c) => [c.name.toUpperCase(), c.id])
  );

  let inserted = 0;
  let skipped = 0;
  const batch: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(
        csv({
          mapHeaders: ({ header }) => normalizeKey(header),
        })
      )
      .on("headers", (headers) => {
        console.log("🧠 Detected CSV headers:", headers);
      })
      .on("data", (row) => {
        try {
          const name = row["medicine name"];
          if (!name) return skipped++;

          const price = Number(
            String(row["price"]).replace(/[₹,]/g, "")
          );
          if (!price || Number.isNaN(price)) return skipped++;

          const rxRaw = row["is prescription required?"];
          const requiresPrescription =
            rxRaw === 1 ||
            rxRaw === "1" ||
            String(rxRaw).toLowerCase() === "yes" ||
            String(rxRaw).toLowerCase() === "true";

          const packSize = Number(row["pack-size"]) || 0;
          const manufacturer = row["manufacturer"] || "Not Known";
          const imageUrl = row["image url"] || null;

          const categoryName =
            row["category"]?.toUpperCase() || "NO CATEGORY";
          const categoryId = categoryMap.get(categoryName) || null;

          batch.push({
            name,
            manufacturer,
            price,
            mrp: price,
            packSize: String(packSize),
            requiresPrescription,
            isScheduleH: requiresPrescription,
            imageUrl,
            categoryId,
            stock: 0,
            sourceFile: "easyload_inventory.csv",
          });

          inserted++;

          if (batch.length === 500) {
            db.insert(medicines).values(batch.splice(0));
          }
        } catch {
          skipped++;
        }
      })
      .on("end", async () => {
        if (batch.length) {
          await db.insert(medicines).values(batch);
        }

        console.log("✅ IMPORT COMPLETE");
        console.log("➕ Inserted:", inserted);
        console.log("⏭️ Skipped:", skipped);
        console.log("🎯 Expected total: 18433");
        resolve();
      })
      .on("error", reject);
  });
}