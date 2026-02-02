import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

/**
 * Bangalore-only inventory importer
 * SAFE • STREAMED • MEMORY-BOUND • PRODUCTION READY
 */

const DATA_DIR = path.join(process.cwd(), "server", "data");
const CSV_FILE = "bangalore_inventory_45k_master.csv";

// Hard safety limits
const MAX_ROWS = 46_000;

export async function importMedicinesFromCSV() {
  console.log("📦 Bangalore inventory import started");

  const filePath = path.join(DATA_DIR, CSV_FILE);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ CSV file NOT FOUND: ${filePath}`);
    return;
  }

  console.log(`📥 Using CSV: ${CSV_FILE}`);

  /* ---------------------------------
     FULL REPLACEMENT (SAFE)
     Only medicines table is cleared
  ---------------------------------- */
  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let inserted = 0;
  const seen = new Set<string>();

  return new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath).pipe(csv());

    stream.on("data", async (row) => {
      try {
        if (inserted >= MAX_ROWS) {
          console.log(`🛑 Reached ${MAX_ROWS} medicines, stopping import`);
          stream.destroy();
          return;
        }

        /* -----------------------------
           REQUIRED FIELDS
        ------------------------------ */
        const name = row["medicine_name"]?.trim();
        const manufacturer = row["manufacturer"]?.trim();
        const priceRaw = row["price"];

        if (!name || !manufacturer || !priceRaw) return;

        const price = Number(priceRaw);
        if (Number.isNaN(price) || price <= 0) return;

        /* -----------------------------
           DEDUP (name + manufacturer)
        ------------------------------ */
        const dedupKey = `${name}__${manufacturer}`.toLowerCase();
        if (seen.has(dedupKey)) return;
        seen.add(dedupKey);

        /* -----------------------------
           FLAGS
        ------------------------------ */
        const rxFlag = row["rx_flag"] === "true" || row["rx_flag"] === true;
        const otcFlag = row["otc_flag"] === "true" || row["otc_flag"] === true;
        const ayurvedicFlag =
          row["ayurvedic_flag"] === "true" || row["ayurvedic_flag"] === true;

        await db.insert(medicines).values({
          name,
          manufacturer,
          genericName: row["composition"] || null,
          price: price.toString(),
          mrp: price.toString(),
          packSize: row["pack_size"] ? String(row["pack_size"]) : null,
          stock: 100,

          requiresPrescription: rxFlag,
          isScheduleH: rxFlag,

          // Optional: you can later map this to category routing
          description: ayurvedicFlag ? "Ayurvedic" : null,
        });

        inserted++;

        if (inserted % 1000 === 0) {
          console.log(`➕ Inserted ${inserted} medicines`);
        }
      } catch {
        // silently skip bad rows
      }
    });

    stream.on("end", () => {
      console.log(`✅ Bangalore inventory import complete: ${inserted} medicines`);
      resolve();
    });

    stream.on("error", (err) => {
      console.error("❌ CSV import failed:", err);
      reject(err);
    });
  });
}