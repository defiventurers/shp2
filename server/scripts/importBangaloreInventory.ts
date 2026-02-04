import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

const CSV_PATH = path.join(
  process.cwd(),
  "server",
  "data",
  "easyload_inventory.csv"
);

export async function importBangaloreInventory() {
  console.log("📦 Starting Bangalore inventory import");

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV NOT FOUND: ${CSV_PATH}`);
  }

  console.log("📥 Using CSV:", CSV_PATH);

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;
  let skipped = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header.replace(/^\uFEFF/, "").trim().toLowerCase(),
        })
      )
      .on("data", async (row) => {
        try {
          const name = row["medicine name"];
          const price = row["price"];
          const packSize = row["quantity(pack size)"];

          if (!name || !price || !packSize) {
            skipped++;
            return;
          }

          await db.insert(medicines).values({
            name: String(name).trim().toUpperCase(),
            price: String(price),
            mrp: String(price),
            packSize: Number(packSize),
            manufacturer: row["manufacturer"]?.trim() || null,
            imageUrl:
              row["image url"] && row["image url"].trim() !== ""
                ? row["image url"].trim()
                : null,
            stock: null,
            requiresPrescription:
              String(row["is prescription required?"])
                .toLowerCase() === "yes",
            isScheduleH:
              String(row["is prescription required?"])
                .toLowerCase() === "yes",
            categoryId: null,
            genericName: null,
          });

          inserted++;

          if (inserted % 1000 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch {
          skipped++;
        }
      })
      .on("end", () => {
        console.log("✅ IMPORT COMPLETE");
        console.log(`➕ Inserted: ${inserted}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        resolve();
      })
      .on("error", reject);
  });
}