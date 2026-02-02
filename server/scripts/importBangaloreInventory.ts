import fs from "fs";
import path from "path";
import zlib from "zlib";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const CSV_FILE = "bangalore_inventory_45k_master.csv";
const MAX_ROWS = 45_000;

function isGzip(filePath: string): boolean {
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(2);
  fs.readSync(fd, buffer, 0, 2, 0);
  fs.closeSync(fd);
  return buffer[0] === 0x1f && buffer[1] === 0x8b;
}

export async function importBangaloreInventory() {
  const filePath = path.join(DATA_DIR, CSV_FILE);

  console.log("📦 Starting Bangalore inventory import");

  if (!fs.existsSync(filePath)) {
    console.error("❌ CSV NOT FOUND:", filePath);
    return;
  }

  console.log("📥 Using CSV:", CSV_FILE);

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  const fileStream = fs.createReadStream(filePath);
  const stream = isGzip(filePath)
    ? fileStream.pipe(zlib.createGunzip())
    : fileStream;

  let inserted = 0;

  return new Promise<void>((resolve, reject) => {
    stream
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
          /* skip bad row */
        }
      })
      .on("end", () => {
        console.log(`✅ Import completed: ${inserted} medicines`);
        resolve();
      })
      .on("error", reject);
  });
}