import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

import { db } from "../db";
import { medicines, categories } from "@shared/schema";

/**
 * ADMIN ROUTES
 */
export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  /**
   * POST /api/admin/import-inventory
   * Imports medicines from server/data/easyload_inventory.csv
   */
  app.post(
    "/api/admin/import-inventory",
    async (_req: Request, res: Response) => {
      console.log("🚨 ADMIN IMPORT ROUTE HIT");

      const csvPath = path.join(
        process.cwd(),
        "server",
        "data",
        "easyload_inventory.csv"
      );

      console.log("📍 CSV PATH:", csvPath);

      if (!fs.existsSync(csvPath)) {
        console.error("❌ CSV FILE NOT FOUND");
        return res.status(404).json({
          success: false,
          error: "CSV file not found",
        });
      }

      try {
        console.log("📦 Starting inventory import");

        /* -----------------------------
           Build CATEGORY NAME → ID map
        ------------------------------ */
        const categoryRows = await db.select().from(categories);
        const categoryMap = new Map(
          categoryRows.map((c) => [c.name.toUpperCase(), c.id])
        );

        /* -----------------------------
           HARD RESET
        ------------------------------ */
        await db.delete(medicines);
        console.log("🧨 Medicines table cleared");

        let inserted = 0;
        let skipped = 0;
        const batch: any[] = [];

        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(csvPath)
            .pipe(csv())
            .on("data", (row) => {
              try {
                const name = row["Medicine Name"]?.trim();
                const price = Number(row["Price"]);
                const packSize = Number(row["Pack-Size"]);
                const manufacturer =
                  row["Manufacturer"]?.trim() || "Not Known";
                const imageUrl = row["Image URL"]?.trim();
                const categoryName = row["Category"]?.trim().toUpperCase();
                const isRx =
                  row["Is Prescription Required?"]
                    ?.toString()
                    .toLowerCase() === "yes";

                // ❌ Guard — skip invalid rows
                if (!name || Number.isNaN(price)) {
                  skipped++;
                  return;
                }

                const categoryId = categoryMap.get(categoryName) ?? null;

                batch.push({
                  name,
                  price,
                  mrp: price,
                  packSize: Number.isFinite(packSize) ? packSize : 0,
                  manufacturer,
                  imageUrl,
                  requiresPrescription: isRx,
                  isScheduleH: isRx,
                  categoryId,
                  sourceFile: "easyload_inventory.csv",
                });

                inserted++;

                if (batch.length === 500) {
                  db.insert(medicines)
                    .values(batch.splice(0))
                    .catch(reject);
                }
              } catch (err) {
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
              console.log(`🎯 Expected total: 18433`);

              resolve();
            })
            .on("error", reject);
        });

        return res.json({
          success: true,
          inserted,
          skipped,
        });
      } catch (err) {
        console.error("❌ IMPORT FAILED:", err);
        return res.status(500).json({
          success: false,
          error: "Inventory import failed",
        });
      }
    }
  );
}