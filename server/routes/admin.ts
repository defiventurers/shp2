import type { Express, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

/**
 * ADMIN ROUTES
 * Manual inventory import only
 */
export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  /**
   * POST /api/admin/import-inventory
   * Manually triggered inventory replacement
   */
  app.post("/api/admin/import-inventory", async (_req, res: Response) => {
    try {
      console.log("🚨 ADMIN IMPORT TRIGGERED");

      const csvPath = path.join(
        process.cwd(),
        "server/data/easyload_inventory.csv"
      );

      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({
          success: false,
          error: "CSV file not found",
        });
      }

      console.log(`📥 Using CSV: ${csvPath}`);

      /* ----------------------------------
         STEP 1: DELETE OLD INVENTORY
      ---------------------------------- */
      await db.delete(medicines);
      console.log("🧨 Old inventory deleted");

      /* ----------------------------------
         STEP 2: READ + INSERT NEW INVENTORY
      ---------------------------------- */
      const rows: any[] = [];

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on("data", (row) => rows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });

      let inserted = 0;
      const BATCH_SIZE = 200;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        await db.insert(medicines).values(
          batch.map((row) => ({
            name: row["Medicine Name"]?.trim(),
            price: String(row["Price"]),
            mrp: String(row["Price"]),
            stock: Number(row["Quantity"]) || 0,
            manufacturer: row["Manufacturer"] || null,
            imageUrl: row["Image URL"] || null,
            requiresPrescription:
              String(row["Is Prescription Required?"]).toLowerCase() === "true",
            isScheduleH:
              String(row["Is Prescription Required?"]).toLowerCase() === "true",
          }))
        );

        inserted += batch.length;

        if (inserted % 500 === 0) {
          console.log(`➕ Inserted ${inserted} medicines`);
        }
      }

      console.log(`✅ IMPORT COMPLETE: ${inserted} medicines`);

      return res.json({
        success: true,
        message: "Inventory replaced successfully",
        total: inserted,
      });
    } catch (err) {
      console.error("❌ ADMIN IMPORT FAILED:", err);
      return res.status(500).json({
        success: false,
        error: "Inventory import failed",
      });
    }
  });
}