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
  app.post("/api/admin/import-inventory", async (_req: Request, res: Response) => {
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

    console.log("🚨 ADMIN INVENTORY IMPORT TRIGGERED");
    console.log(`📥 Using CSV: ${csvPath}`);

    try {
      /* -----------------------------
         HARD RESET (SAFE ORDER)
      ------------------------------ */
      await db.delete(orderItems);
      console.log("🧨 order_items cleared");

      await db.delete(orders);
      console.log("🧨 orders cleared");

      await db.delete(medicines);
      console.log("🧨 medicines cleared");

      /* -----------------------------
         CSV STREAM IMPORT
      ------------------------------ */
      let count = 0;
      const batch: any[] = [];

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on("data", (row) => {
            try {
              const rawPrice = row["Price"]?.toString().trim();
              if (!rawPrice) return;

              const price = Number(rawPrice.replace(/[₹,]/g, ""));
              if (Number.isNaN(price)) return;

              const isRx =
                row["Is Prescription Required?"]
                  ?.toString()
                  .toLowerCase() === "yes";

              const packSize = Number(row["Quantity"]);
              
              batch.push({
                name: row["Medicine Name"]?.trim()?.toUpperCase(),
                manufacturer: row["Manufacturer"] || null,

                // 💰 Pricing
                price,
                mrp: price,

                // 📦 Correct semantics
                packSize: Number.isFinite(packSize) ? packSize : null,
                stock: null, // ✅ intentionally unknown

                // 🖼 Images
                imageUrls: row["Image URL"]
                  ? [row["Image URL"]]
                  : null,

                // ⚕️ Flags
                isScheduleH: isRx,
                requiresPrescription: isRx,
              });

              count++;

              if (batch.length === 500) {
                db.insert(medicines)
                  .values(batch.splice(0))
                  .then(() => {
                    console.log(`➕ Inserted ${count} medicines`);
                  })
                  .catch(reject);
              }
            } catch (err) {
              reject(err);
            }
          })
          .on("end", async () => {
            if (batch.length) {
              await db.insert(medicines).values(batch);
              console.log(`➕ Inserted ${count} medicines`);
            }

            console.log(`✅ IMPORT COMPLETE: ${count} medicines`);
            resolve();
          })
          .on("error", reject);
      });

      res.json({
        success: true,
        message: `Inventory import completed successfully (${count} items)`,
      });
    } catch (err) {
      console.error("❌ IMPORT FAILED:", err);
      res.status(500).json({ error: "Inventory import failed" });
    }
  });
}