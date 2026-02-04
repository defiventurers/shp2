import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  app.post("/api/admin/import-inventory", async (_req: Request, res: Response) => {
    try {
      console.log("🚨 ADMIN INVENTORY IMPORT TRIGGERED");

      const csvPath = path.join(
        process.cwd(),
        "server/data/easyload_inventory.csv"
      );

      console.log("📥 Using CSV:", csvPath);

      if (!fs.existsSync(csvPath)) {
        throw new Error("CSV file not found at " + csvPath);
      }

      // 🔥 Clear existing inventory
      await db.delete(medicines);
      console.log("🧨 Medicines table cleared");

      const rows: any[] = [];

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on("data", (row) => rows.push(row))
          .on("end", () => resolve())
          .on("error", reject);
      });

      let inserted = 0;

      for (const row of rows) {
        await db.insert(medicines).values({
          name: row["Medicine Name"],
          price: row["Price"],
          mrp: row["Price"],
          stock: Number(row["Quantity"]) || 0,
          manufacturer: row["Manufacturer"] || null,
          imageUrl: row["Image URL"] || null,
          isScheduleH:
            String(row["Is Prescription Required?"]).toLowerCase() === "true",
          requiresPrescription:
            String(row["Is Prescription Required?"]).toLowerCase() === "true",
        });

        inserted++;
        if (inserted % 500 === 0) {
          console.log(`➕ Inserted ${inserted} medicines`);
        }
      }

      console.log(`✅ IMPORT COMPLETE: ${inserted} medicines`);
      res.json({ success: true, inserted });
    } catch (err: any) {
      console.error("❌ IMPORT FAILED:", err);
      res.status(500).json({ error: err.message });
    }
  });
}