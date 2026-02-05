import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

export async function importBangaloreInventory() {
  console.log("📦 Starting inventory import");

  const csvPath = path.join(
    process.cwd(),
    "server",
    "data",
    "easyload_inventory.csv"
  );

  console.log("📍 CSV PATH:", csvPath);

  if (!fs.existsSync(csvPath)) {
    throw new Error("CSV FILE NOT FOUND");
  }

  await db.delete(medicines);
  console.log("🧨 Medicines table cleared");

  let rowCount = 0;

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(
        csv({
          separator: ",",   // we will change this after confirmation
          skipLines: 0,
        })
      )
      .on("data", (row) => {
        rowCount++;

        // 🔴 PRINT ONLY FIRST ROW
        if (rowCount === 1) {
          console.log("🚨 FIRST ROW RAW OBJECT:");
          console.log(row);
          console.log("🚨 FIRST ROW KEYS:");
          console.log(Object.keys(row));
        }
      })
      .on("end", () => {
        console.log("📊 Total rows read:", rowCount);
        resolve();
      })
      .on("error", reject);
  });

  console.log("🛑 STOPPING AFTER DIAGNOSTIC RUN");
}