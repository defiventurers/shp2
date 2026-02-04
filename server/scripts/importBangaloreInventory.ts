import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

export async function importBangaloreInventory() {
  const csvPath = path.join(
    process.cwd(),
    "server",
    "data",
    "easyload_inventory.csv"
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error("CSV file not found");
  }

  console.log("📥 Importing inventory from:", csvPath);

  await db.delete(medicines);

  let inserted = 0;
  let skipped = 0;
  const batch: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          const name = row["Medicine Name"]?.trim();
          const priceRaw = row["Price"];
          if (!name || !priceRaw) {
            skipped++;
            return;
          }

          const price = Number(String(priceRaw).replace(/[₹,]/g, ""));
          if (Number.isNaN(price)) {
            skipped++;
            return;
          }

          batch.push({
            name,
            manufacturer: row["Manufacturer"] || "Not Known",
            packSize: row["Pack-Size"] || null,
            price,
            mrp: price,
            requiresPrescription:
              String(row["Is Prescription Required?"]).toLowerCase() === "yes",
            isScheduleH:
              String(row["Is Prescription Required?"]).toLowerCase() === "yes",
            imageUrl: row["Image URL"] || null,
            sourceFile: row["Source File"] || "easyload_inventory.csv",
          });

          inserted++;

          if (batch.length === 500) {
            db.insert(medicines)
              .values(batch.splice(0))
              .catch(reject);
            console.log(`➕ Inserted ${inserted}`);
          }
        } catch (e) {
          skipped++;
        }
      })
      .on("end", async () => {
        if (batch.length) {
          await db.insert(medicines).values(batch);
        }
        console.log("✅ IMPORT COMPLETE");
        console.log(`➕ Inserted: ${inserted}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        resolve();
      })
      .on("error", reject);
  });
}