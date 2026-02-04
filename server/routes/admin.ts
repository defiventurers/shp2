import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, orders, orderItems } from "@shared/schema";

export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  /**
   * POST /api/admin/import-inventory
   */
  app.post(
    "/api/admin/import-inventory",
    async (_req: Request, res: Response) => {
      const csvPath = path.join(
        process.cwd(),
        "server",
        "data",
        "easyload_inventory.csv"
      );

      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({
          error: "CSV file not found at server/data/easyload_inventory.csv",
        });
      }

      console.log("⚙️ ADMIN INVENTORY IMPORT TRIGGERED");
      console.log(`📥 Using CSV: ${csvPath}`);

      try {
        /* -----------------------------
           HARD RESET (SAFE ORDER)
        ------------------------------ */
        await db.delete(orderItems);
        await db.delete(orders);
        await db.delete(medicines);

        console.log("🧨 Existing inventory cleared");

        let inserted = 0;
        let skipped = 0;
        const batch: any[] = [];

        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(csvPath)
            .pipe(
              csv({
                mapHeaders: ({ header }) =>
                  header
                    .replace(/^\uFEFF/, "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase(),
              })
            )
            .on("data", async (row) => {
              try {
                const name = row["medicine name"];
                const rawPrice = row["price"];
                const quantity = row["quantity"];

                if (!name || !rawPrice || !quantity) {
                  skipped++;
                  return;
                }

                const price = Number(
                  String(rawPrice).replace(/[₹,]/g, "")
                );
                if (!Number.isFinite(price)) {
                  skipped++;
                  return;
                }

                const packSize = Number(quantity);
                const isRx =
                  String(row["is prescription required?"])
                    .trim()
                    .toLowerCase() === "yes";

                const imageUrl =
                  row["image url"] && String(row["image url"]).trim() !== ""
                    ? String(row["image url"]).trim()
                    : null;

                batch.push({
                  name: String(name).trim().toUpperCase(),
                  manufacturer: row["manufacturer"]
                    ? String(row["manufacturer"]).trim()
                    : null,

                  price,
                  mrp: price,

                  packSize: Number.isFinite(packSize) ? packSize : null,
                  stock: null,

                  // ✅ CORRECT FIELD (NOT imageUrls)
                  imageUrl,

                  requiresPrescription: isRx,
                  isScheduleH: isRx,

                  categoryId: null,
                  genericName: null,
                });

                if (batch.length === 500) {
                  await db.insert(medicines).values(batch.splice(0));
                  inserted += 500;
                  console.log(`➕ Inserted ${inserted} medicines`);
                }
              } catch (err) {
                reject(err);
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
              resolve();
            })
            .on("error", reject);
        });

        res.json({
          success: true,
          message: `Inventory import completed (${inserted} medicines)`,
        });
      } catch (err) {
        console.error("❌ IMPORT FAILED:", err);
        res.status(500).json({ error: "Inventory import failed" });
      }
    }
  );
}