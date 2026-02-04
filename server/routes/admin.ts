import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, orders, orderItems, categories } from "@shared/schema";

const CSV_PATH = path.join(
  process.cwd(),
  "server",
  "data",
  "easyload_inventory.csv"
);

export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  /**
   * POST /api/admin/import-inventory
   * TEMP: NO AUTH — we add it back after import works
   */
  app.post("/api/admin/import-inventory", async (_req: Request, res: Response) => {
    console.log("🚨 ADMIN IMPORT ROUTE HIT");
    console.log("📍 CSV PATH:", CSV_PATH);

    if (!fs.existsSync(CSV_PATH)) {
      console.error("❌ CSV NOT FOUND");
      return res.status(404).json({ success: false, error: "CSV not found" });
    }

    try {
      console.log("📦 Starting inventory import");

      // HARD RESET (SAFE ORDER)
      await db.delete(orderItems);
      await db.delete(orders);
      await db.delete(medicines);

      console.log("🧨 Medicines table cleared");

      let inserted = 0;
      let skipped = 0;
      const batch: any[] = [];

      const categoryMap = new Map<string, string>();
      const cats = await db.select().from(categories);
      for (const c of cats) categoryMap.set(c.name, c.id);

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(CSV_PATH)
          .pipe(csv())
          .on("data", (row) => {
            try {
              const name = row["Medicine Name"]?.toString().trim();
              if (!name) {
                skipped++;
                return;
              }

              const price = Number(row["Price"]);
              if (Number.isNaN(price)) {
                skipped++;
                return;
              }

              const isRx =
                row["Is Prescription Required?"]
                  ?.toString()
                  .toLowerCase() === "yes";

              const packSize = Number(row["Pack-Size"]);
              const manufacturer = row["Manufacturer"] || "Not Known";
              const imageUrl = row["Image URL"] || null;
              const categoryName = row["Category"];
              const categoryId = categoryMap.get(categoryName) || null;

              batch.push({
                name,
                manufacturer,
                categoryId,
                packSize: Number.isFinite(packSize) ? packSize.toString() : "0",
                price,
                mrp: price,
                stock: 0,
                requiresPrescription: isRx,
                isScheduleH: isRx,
                imageUrl,
                sourceFile: "easyload_inventory.csv",
              });

              if (batch.length === 500) {
                db.insert(medicines)
                  .values(batch.splice(0))
                  .then(() => {
                    inserted += 500;
                    console.log(`➕ Inserted ${inserted}`);
                  })
                  .catch(reject);
              }
            } catch {
              skipped++;
            }
          })
          .on("end", async () => {
            if (batch.length) {
              await db.insert(medicines).values(batch);
              inserted += batch.length;
            }

            console.log("✅ IMPORT COMPLETE");
            console.log(`➕ Inserted: ${inserted}`);
            console.log(`⏭️ Skipped: ${skipped}`);
            console.log(`🎯 Expected total: 18433`);
            resolve();
          })
          .on("error", reject);
      });

      res.json({ success: true, inserted, skipped });
    } catch (err) {
      console.error("❌ IMPORT FAILED:", err);
      res.status(500).json({ success: false });
    }
  });
}