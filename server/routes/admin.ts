import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";
import { resolveCategoryNameFromRaw } from "../utils/categoryMapping";

function resolveImportTokens(row: Record<string, unknown>) {
  const rawCategory = String(row["Category"] || "").trim();
  const rawSourceFile = String(row["Source File"] || "").trim();

  const sourceToken = rawSourceFile || rawCategory || "Others";
  const categoryToken = rawCategory || rawSourceFile || "";

  return { sourceToken, categoryToken };
}

function medicineKey(name: string, manufacturer: string, packSize: number) {
  return `${name.trim().toUpperCase()}|${manufacturer.trim().toUpperCase()}|${packSize}`;
}

/* ---------------- ROUTES ---------------- */
export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  app.post("/api/admin/clear-medicines", async (_req: Request, res: Response) => {
    try {
      const deletedResult = await db.execute(sql`
        DELETE FROM medicines m
        WHERE NOT EXISTS (
          SELECT 1
          FROM order_items oi
          WHERE oi.medicine_id = m.id
        )
        RETURNING m.id
      `);

      res.json({
        success: true,
        deleted: deletedResult.rows.length,
        note: "Only medicines not referenced by order_items were deleted.",
      });
    } catch (err) {
      console.error("❌ FAILED TO CLEAR MEDICINES", err);
      res.status(500).json({ success: false, error: "Failed to clear medicines" });
    }
  });

  app.post("/api/admin/import-inventory", async (_req: Request, res: Response) => {
    try {
      console.log("🚨 ADMIN IMPORT ROUTE HIT");

      const csvPath = path.join(process.cwd(), "server", "data", "easyload_inventory.csv");

      console.log("📍 CSV PATH:", csvPath);

      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ error: "CSV file not found" });
      }

      console.log("📦 Starting inventory import");

      const categoryMap = new Map<string, string>();
      const allCategories = await db.select().from(categories);

      for (const c of allCategories) {
        categoryMap.set(c.name.toUpperCase(), c.id);
      }

      console.log("📦 Loaded categories:", [...categoryMap.keys()]);

      const existingMedicines = await db
        .select({
          id: medicines.id,
          name: medicines.name,
          manufacturer: medicines.manufacturer,
          packSize: medicines.packSize,
        })
        .from(medicines);

      const existingByKey = new Map<string, { id: string }>();

      for (const row of existingMedicines) {
        const key = medicineKey(row.name || "", row.manufacturer || "NOT KNOWN", row.packSize || 0);
        existingByKey.set(key, {
          id: row.id,
        });
      }

      let inserted = 0;
      let updated = 0;
      let skipped = 0;

      const categoryStats = new Map<string, number>();
      const insertBatch: any[] = [];
      const updateBatch: Array<{ id: string; payload: any }> = [];
      const BATCH_SIZE = 250;

      const flushInserts = async () => {
        if (!insertBatch.length) return;
        await db.insert(medicines).values(insertBatch);
        inserted += insertBatch.length;
        insertBatch.length = 0;
      };

      const flushUpdates = async () => {
        if (!updateBatch.length) return;
        await Promise.all(
          updateBatch.map((entry) =>
            db
              .update(medicines)
              .set(entry.payload)
              .where(eq(medicines.id, entry.id)),
          ),
        );
        updated += updateBatch.length;
        updateBatch.length = 0;
      };

      const stream = fs.createReadStream(csvPath).pipe(csv());

      for await (const row of stream) {
        try {
          const name = String(row["Medicine Name"] || "").trim();
          if (!name) {
            skipped++;
            continue;
          }

          const priceRaw = row["Price"];
          const price =
            typeof priceRaw === "number"
              ? priceRaw
              : Number(String(priceRaw).replace(/[₹,]/g, ""));

          if (!Number.isFinite(price)) {
            skipped++;
            continue;
          }

          const packSize = Number(row["Pack-Size"]);
          const normalizedPackSize = Number.isFinite(packSize) ? packSize : 0;

          const isRx = Number(row["Is Prescription Required?"]) === 1;
          const manufacturer = String(row["Manufacturer"] || "NOT KNOWN").trim();
          const imageUrl = String(row["Image URL"] || "").trim();

          const { sourceToken, categoryToken } = resolveImportTokens(row);

          const categoryName = resolveCategoryNameFromRaw(sourceToken, categoryToken);
          const categoryId = categoryMap.get(categoryName.toUpperCase());

          if (!categoryId) {
            skipped++;
            continue;
          }

          categoryStats.set(categoryName, (categoryStats.get(categoryName) || 0) + 1);

          const payload = {
            name,
            price,
            mrp: price,
            packSize: normalizedPackSize,
            manufacturer,
            requiresPrescription: isRx,
            isScheduleH: isRx,
            imageUrl: imageUrl || null,
            categoryId,
            stock: null,
            sourceFile: sourceToken,
          };

          const key = medicineKey(name, manufacturer, normalizedPackSize);
          const existing = existingByKey.get(key);

          if (existing) {
            updateBatch.push({ id: existing.id, payload });
          } else {
            insertBatch.push(payload);
            existingByKey.set(key, { id: `pending-${inserted + insertBatch.length}` });
          }

          if (insertBatch.length >= BATCH_SIZE) {
            await flushInserts();
          }

          if (updateBatch.length >= 100) {
            await flushUpdates();
          }
        } catch {
          skipped++;
        }
      }

      await flushInserts();
      await flushUpdates();

      const deletedOrphans = await db.execute(sql`
        DELETE FROM medicines m
        WHERE NOT EXISTS (
          SELECT 1
          FROM order_items oi
          WHERE oi.medicine_id = m.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM categories c
          WHERE c.id = m.category_id
        )
        RETURNING m.id
      `);

      const categoryBreakdown = await db.execute(sql`
        SELECT c.name as category_name, COUNT(*)::int as count
        FROM medicines m
        LEFT JOIN categories c ON c.id = m.category_id
        GROUP BY c.name
        ORDER BY COUNT(*) DESC
      `);

      console.log("✅ IMPORT COMPLETE");
      console.log(`➕ Inserted: ${inserted}`);
      console.log(`🔁 Updated: ${updated}`);
      console.log(`⏭️ Skipped: ${skipped}`);
      console.log(`🧹 Deleted orphan legacy rows: ${deletedOrphans.rows.length}`);
      console.log("📊 Category stats from CSV mapping:", Object.fromEntries(categoryStats.entries()));
      console.log("📊 Category stats in DB:", categoryBreakdown.rows);
      console.log("🎯 Expected total: 18433");

      res.json({
        success: true,
        inserted,
        updated,
        skipped,
        deletedOrphans: deletedOrphans.rows.length,
        categoryStats: Object.fromEntries(categoryStats.entries()),
        categoryBreakdown: categoryBreakdown.rows,
        note: "Referenced medicines are updated in-place to preserve order_items foreign keys.",
      });
    } catch (err) {
      console.error("❌ ADMIN IMPORT FAILED", err);
      res.status(500).json({ success: false, error: "Inventory import failed" });
    }
  });
}
