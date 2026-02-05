import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  app.post("/api/admin/import-inventory", async (_req: Request, res: Response) => {
    console.log("🚨 ADMIN IMPORT ROUTE HIT");

    const csvPath = path.join(
      process.cwd(),
      "server",
      "data",
      "easyload_inventory.csv"
    );

    console.log("📍 CSV PATH:", csvPath);

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: "CSV file not found" });
    }

    let inserted = 0;
    let skipped = 0;

    console.log("📦 Starting inventory import");

    await db.delete(medicines);
    console.log("🧨 Medicines table cleared");

    const categoryCache = new Map<string, string>();

    const allCategories = await db.select().from(categories);
    for (const c of allCategories) {
      categoryCache.set(c.name.toUpperCase(), c.id);
    }

    const batch: any[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (row) => {
          try {
            const name = String(row["Medicine Name"] || "").trim();
            if (!name) {
              skipped++;
              return;
            }

            const priceRaw = row["Price"];
            const price =
              typeof priceRaw === "number"
                ? priceRaw
                : Number(String(priceRaw).replace(/[₹,]/g, ""));

            if (!Number.isFinite(price)) {
              skipped++;
              return;
            }

            const packSizeRaw = row["Pack-Size"];
            const packSize =
              typeof packSizeRaw === "number"
                ? packSizeRaw
                : Number(packSizeRaw);

            const rxValue = String(row["Is Prescription Required?"]).toLowerCase();
            const isRx = rxValue === "yes" || rxValue === "true";

            const manufacturer =
              String(row["Manufacturer"] || "Not Known").trim();

            const imageUrl = String(row["Image URL"] || "").trim();

            const categoryName = String(row["Category"] || "No category")
              .trim()
              .toUpperCase();

            const categoryId = categoryCache.get(categoryName) || null;

            batch.push({
              name,
              price,
              mrp: price,
              packSize: Number.isFinite(packSize) ? packSize : 0,
              manufacturer,
              requiresPrescription: isRx,
              isScheduleH: isRx,
              imageUrl: imageUrl || null,
              categoryId,
              stock: null,
              sourceFile: "easyload_inventory.csv",
            });

            inserted++;

            if (batch.length === 500) {
              db.insert(medicines).values(batch.splice(0)).catch(reject);
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

    res.json({
      success: true,
      inserted,
      skipped,
    });
  });
}