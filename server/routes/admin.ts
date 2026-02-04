import type { Express, Request, Response } from "express";
import { db } from "../db";
import { medicines, orders, orderItems } from "@shared/schema";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  app.post("/api/admin/import-inventory", async (_req: Request, res: Response) => {
    console.log("🚨 ADMIN INVENTORY IMPORT TRIGGERED");

    const csvPath = path.join(
      process.cwd(),
      "server/data/easyload_inventory.csv"
    );

    console.log(`📥 Using CSV: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      return res.status(400).json({ error: "CSV file not found" });
    }

    try {
      // 🔥 CRITICAL FIX — clear dependent tables FIRST
      await db.delete(orderItems);
      await db.delete(orders);
      await db.delete(medicines);

      console.log("🧨 order_items cleared");
      console.log("🧨 orders cleared");
      console.log("🧨 medicines cleared");

      const rows: any[] = [];

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on("data", (row) => rows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });

      let inserted = 0;

      for (const row of rows) {
        await db.insert(medicines).values({
          name: row["Medicine Name"]?.trim(),
          price: row["Price"],
          requiresPrescription:
            row["Is Prescription Required?"]?.toLowerCase() === "true",
          stock: Number(row["Quantity"]) || 0,
          manufacturer: row["Manufacturer"] || null,
          imageUrl: row["Image URL"] || null,
        });

        inserted++;
        if (inserted % 500 === 0) {
          console.log(`➕ Inserted ${inserted} medicines`);
        }
      }

      console.log(`✅ IMPORT COMPLETE: ${inserted} medicines`);

      res.json({
        success: true,
        count: inserted,
      });
    } catch (err) {
      console.error("❌ IMPORT FAILED:", err);
      res.status(500).json({ error: "Inventory import failed" });
    }
  });
}