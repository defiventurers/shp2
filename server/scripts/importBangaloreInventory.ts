import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const CSV_FILE = "bangalore_inventory_45k_master.csv";
const MAX_ROWS = 45_000;

export async function importBangaloreInventory() {
  const filePath = path.join(DATA_DIR, CSV_FILE);

  console.log("📦 Bangalore inventory import started");

  if (!fs.existsSync(filePath)) {
    console.error("❌ CSV NOT FOUND:", filePath);
    return;
  }

  console.log("📥 Using CSV:", CSV_FILE);

  // FULL REPLACEMENT (as per your rules)
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", async (row) => {
        if (inserted >= MAX_ROWS) return;

        const name = row["medicine_name"];
        const manufacturer = row["manufacturer"];
        const price = row["price"];

        if (!name || !manufacturer || !price) return;

        try {
          await db.insert(medicines).values({
            name: name.trim(),
            manufacturer: manufacturer.trim(),
            genericName: row["composition"] || null,
            price: String(price),
            mrp: String(price),
            packSize: Number(row["pack_size"] || 1),
            stock: 100,
            requiresPrescription: row["rx_flag"] === "true",
            isScheduleH: row["rx_flag"] === "true",
          });

          inserted++;

          if (inserted % 1000 === 0) {
            console.log(`➕ Inserted ${inserted} medicines`);
          }
        } catch {
          // ignore duplicate / bad rows
        }
      })
      .on("end", () => {
        console.log(`✅ Import completed: ${inserted} medicines`);
        resolve();
      })
      .on("error", reject);
  });
}