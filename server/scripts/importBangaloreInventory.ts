import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { sql } from "drizzle-orm";

const CSV_PATH = path.join(
  process.cwd(),
  "server",
  "data",
  "bangalore_inventory_45k_master.csv"
);

const BATCH_SIZE = 5000;
const IMPORT_KEY = "bangalore_inventory";

/* ----------------------------------
   Ensure import_state table exists
----------------------------------- */
async function ensureImportStateTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS import_state (
      key TEXT PRIMARY KEY,
      last_row INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT now()
    );
  `);
}

/* ----------------------------------
   Get last imported row
----------------------------------- */
async function getLastRow(): Promise<number> {
  const result = await db.execute(sql`
    SELECT last_row FROM import_state WHERE key = ${IMPORT_KEY};
  `);

  // @ts-ignore
  return result.rows?.[0]?.last_row ?? 0;
}

/* ----------------------------------
   Update cursor
----------------------------------- */
async function updateLastRow(row: number) {
  await db.execute(sql`
    INSERT INTO import_state (key, last_row)
    VALUES (${IMPORT_KEY}, ${row})
    ON CONFLICT (key)
    DO UPDATE SET
      last_row = EXCLUDED.last_row,
      updated_at = now();
  `);
}

/* ----------------------------------
   Main import function
----------------------------------- */
export async function importBangaloreInventory() {
  console.log("📦 Bangalore inventory batch import started");

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found at ${CSV_PATH}`);
  }

  await ensureImportStateTable();

  const startRow = await getLastRow();
  const endRow = startRow + BATCH_SIZE;

  console.log(`📍 Importing rows ${startRow} → ${endRow}`);

  let currentRow = 0;
  let inserted = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          if (currentRow < startRow) {
            currentRow++;
            return;
          }

          if (currentRow >= endRow) {
            return;
          }

          currentRow++;

          const name = row["medicine_name"]?.trim();
          const manufacturer = row["manufacturer"]?.trim();
          const price = parseFloat(row["price"]);

          if (!name || !manufacturer || isNaN(price)) return;

          await db.insert(medicines).values({
            name,
            manufacturer,
            genericName: row["composition"] || null,
            price: price.toString(),
            mrp: price.toString(),
            packSize: row["pack_size"] || null,
            stock: 999,
            requiresPrescription: row["rx_flag"] === "true",
            isScheduleH: row["rx_flag"] === "true",
          });

          inserted++;
        } catch {
          // skip bad rows silently
        }
      })
      .on("end", async () => {
        await updateLastRow(endRow);
        console.log(`✅ Imported ${inserted} medicines`);
        resolve();
      })
      .on("error", reject);
  });
}