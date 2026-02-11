import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";
import { resolveCategoryNameFromRaw } from "../utils/categoryMapping";
import { sql } from "drizzle-orm";

function resolveImportTokens(row: Record<string, unknown>) {
  const rawCategory = String(row["Category"] || "").trim();
  const rawSourceFile = String(row["Source File"] || "").trim();

  const sourceToken = rawSourceFile || rawCategory || "Others";
  const categoryToken = rawCategory || rawSourceFile || "";

  return { sourceToken, categoryToken };
}

/* ---------------- ROUTES ---------------- */
export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  app.post("/api/admin/clear-medicines", async (_req: Request, res: Response) => {
    try {
      const deleted = await db.delete(medicines).returning({ id: medicines.id });
      res.json({ success: true, deleted: deleted.length });
    } catch (err) {
      console.error("❌ FAILED TO CLEAR MEDICINES", err);
      res.status(500).json({ success: false, error: "Failed to clear medicines" });
    }
  });

  app.post("/api/admin/import-inventory", async (_req: Request, res: Response) => {
    console.log("🚨 ADMIN IMPORT ROUTE HIT");

    const csvPath = path.join(process.cwd(), "server", "data", "easyload_inventory.csv");

    console.log("📍 CSV PATH:", csvPath);

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: "CSV file not found" });
    }

    console.log("📦 Starting inventory import");

    /* -------- LOAD CATEGORIES -------- */
    const categoryMap = new Map<string, string>();
    const allCategories = await db.select().from(categories);

    for (const c of allCategories) {
      categoryMap.set(c.name.toUpperCase(), c.id);
    }

    console.log("📦 Loaded categories:", [...categoryMap.keys()]);

    /* -------- CLEAR MEDICINES -------- */
    await db.delete(medicines);
    console.log("🧨 Medicines table cleared");

    let inserted = 0;
    let skipped = 0;

    const categoryStats = new Map<string, number>();
    const batch: any[] = [];
    const BATCH_SIZE = 250;

    const stream = fs.createReadStream(csvPath).pipe(csv());

    for await (const row of stream) {
      try {
        /* -------- NAME -------- */
        const name = String(row["Medicine Name"] || "").trim();
        if (!name) {
          skipped++;
          continue;
        }

        /* -------- PRICE -------- */
        const priceRaw = row["Price"];
        const price =
          typeof priceRaw === "number"
            ? priceRaw
            : Number(String(priceRaw).replace(/[₹,]/g, ""));

        if (!Number.isFinite(price)) {
          skipped++;
          continue;
        }

        /* -------- PACK SIZE -------- */
        const packSize = Number(row["Pack-Size"]);

        /* 🔴 -------- RX FIX (IMPORTANT) -------- */
        // CSV values: 1.0 = Rx, NaN = Not Rx
        const isRx = Number(row["Is Prescription Required?"]) === 1;

        /* -------- OTHER FIELDS -------- */
        const manufacturer = String(row["Manufacturer"] || "NOT KNOWN").trim();
        const imageUrl = String(row["Image URL"] || "").trim();

        const { sourceToken, categoryToken } = resolveImportTokens(row);

        /* -------- CATEGORY -------- */
        const categoryName = resolveCategoryNameFromRaw(sourceToken, categoryToken);
        const categoryId = categoryMap.get(categoryName.toUpperCase());

        if (!categoryId) {
          skipped++;
          continue;
        }

        categoryStats.set(categoryName, (categoryStats.get(categoryName) || 0) + 1);

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
          sourceFile: sourceToken,
        });

        if (batch.length >= BATCH_SIZE) {
          await db.insert(medicines).values(batch);
          inserted += batch.length;
          batch.length = 0;

          if (inserted % 2000 === 0) {
            console.log(`➕ Inserted ${inserted}`);
          }
        }
      } catch {
        skipped++;
      }
    }

    if (batch.length > 0) {
      await db.insert(medicines).values(batch);
      inserted += batch.length;
    }

    const categoryBreakdown = await db.execute(sql`
      SELECT c.name as category_name, COUNT(*)::int as count
      FROM medicines m
      LEFT JOIN categories c ON c.id = m.category_id
      GROUP BY c.name
      ORDER BY COUNT(*) DESC
    `);

    console.log("✅ IMPORT COMPLETE");
    console.log(`➕ Inserted: ${inserted}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log("📊 Category stats from CSV mapping:", Object.fromEntries(categoryStats.entries()));
    console.log("📊 Category stats in DB:", categoryBreakdown.rows);
    console.log("🎯 Expected total: 18433");

    res.json({
      success: true,
      inserted,
      skipped,
      categoryStats: Object.fromEntries(categoryStats.entries()),
      categoryBreakdown: categoryBreakdown.rows,
    });
  });
}
