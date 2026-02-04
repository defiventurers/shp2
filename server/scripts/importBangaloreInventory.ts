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
            header
              .replace(/^\uFEFF/, "")   // remove BOM
              .replace(/\s+/g, " ")     // normalize spaces
              .trim()
              .toLowerCase(),
        })
      )
      .on("data", async (row) => {
        try {
          // 🔑 NORMALIZED KEYS (NOW RELIABLE)
          const name = row["medicine name"];
          const price = row["price"];
          const packSize = row["quantity"];

          if (!name || !price || !packSize) {
            skipped++;
            return;
          }

          await db.insert(medicines).values({
            name: String(name).trim().toUpperCase(),
            price: String(price),
            mrp: String(price),
            packSize: Number(packSize),

            manufacturer: row["manufacturer"]
              ? String(row["manufacturer"]).trim()
              : null,

            imageUrl:
              row["image url"] && String(row["image url"]).trim() !== ""
                ? String(row["image url"]).trim()
                : null,

            requiresPrescription:
              String(row["is prescription required?"])
                .trim()
                .toLowerCase() === "yes",

            isScheduleH:
              String(row["is prescription required?"])
                .trim()
                .toLowerCase() === "yes",

            stock: null,
            categoryId: null,
            genericName: null,
          });

          inserted++;

          if (inserted % 1000 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch (err) {
          skipped++;
          console.error("❌ INSERT ERROR:", err);
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