import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";

const DOSAGE_FORM_CATEGORIES = [
  "TABLETS",
  "CAPSULES",
  "INJECTIONS",
  "SYRUPS",
  "TOPICALS",
  "DROPS",
  "POWDERS",
  "MOUTHWASH",
  "INHALERS",
  "DEVICES",
  "SCRUBS",
  "SOLUTIONS",
  "NO CATEGORY",
] as const;

const DOSAGE_FORM_ALLOWLIST = new Set<string>(DOSAGE_FORM_CATEGORIES);

function normalizeCategory(rawCategory: unknown): string {
  const normalized = String(rawCategory ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "NO CATEGORY";
  }

  return DOSAGE_FORM_ALLOWLIST.has(normalized) ? normalized : "NO CATEGORY";
}

function normalizeCategoryKey(rawCategory: unknown): string {
  return String(rawCategory ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function resolveImportTokens(row: Record<string, unknown>) {
  const rawCategory = String(row["Category"] || "").trim();
  const rawSourceFile = String(row["Source File"] || "").trim();

  const sourceToken = rawSourceFile || rawCategory || "Others";

  return { sourceToken, rawCategory, rawSourceFile };
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
        categoryMap.set(normalizeCategoryKey(c.name), c.id);
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

      let totalRowsProcessed = 0;
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let forcedNoCategoryCount = 0;

      const categoryStats = new Map<string, number>();
      const invalidCategoryValues = new Set<string>();
      const unknownDbCategoryValues = new Set<string>();
      const loggedUnknownDbCategories = new Set<string>();
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
        totalRowsProcessed++;

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

          const { sourceToken, rawCategory, rawSourceFile } = resolveImportTokens(row);
          const rawCategoryInput = rawCategory || rawSourceFile;
          const normalizedInput = normalizeCategoryKey(rawCategoryInput);

          let normalizedCategory = normalizeCategory(rawCategoryInput);
          const invalidCategory = Boolean(normalizedInput) && !DOSAGE_FORM_ALLOWLIST.has(normalizedInput);

          if (invalidCategory) {
            forcedNoCategoryCount++;
            invalidCategoryValues.add(normalizedInput);
          }

          let categoryId = categoryMap.get(normalizedCategory);

          if (!categoryId) {
            unknownDbCategoryValues.add(normalizedCategory);
            if (!loggedUnknownDbCategories.has(normalizedCategory)) {
              console.warn(
                `⚠️ Missing DB category '${normalizedCategory}', falling back to 'NO CATEGORY'.`,
              );
              loggedUnknownDbCategories.add(normalizedCategory);
            }

            normalizedCategory = "NO CATEGORY";
            categoryId = categoryMap.get(normalizedCategory) ?? null;
          }

          if (!categoryId) {
            skipped++;
            continue;
          }

          categoryStats.set(normalizedCategory, (categoryStats.get(normalizedCategory) || 0) + 1);

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
      console.log(`📈 Total rows processed: ${totalRowsProcessed}`);
      console.log(`➕ Inserted: ${inserted}`);
      console.log(`🔁 Updated: ${updated}`);
      console.log(`⏭️ Skipped: ${skipped}`);
      console.log(`🧭 Forced to NO CATEGORY (invalid): ${forcedNoCategoryCount}`);
      console.log(`🧹 Deleted orphan legacy rows: ${deletedOrphans.rows.length}`);
      console.log("📊 Category stats from normalized mapping:", Object.fromEntries(categoryStats.entries()));
      console.log("📊 Category stats in DB:", categoryBreakdown.rows);
      console.log("📛 Distinct invalid categories (max 30):", [...invalidCategoryValues].slice(0, 30));
      console.log("📛 Distinct missing DB categories:", [...unknownDbCategoryValues]);
      console.log("🎯 Expected total: 18433");

      res.json({
        success: true,
        totalRowsProcessed,
        inserted,
        updated,
        skipped,
        deletedOrphans: deletedOrphans.rows.length,
        categoryStats: Object.fromEntries(categoryStats.entries()),
        categoryBreakdown: categoryBreakdown.rows,
        forcedNoCategoryCount,
        invalidCategories: [...invalidCategoryValues].slice(0, 30),
        missingDbCategories: [...unknownDbCategoryValues],
        note: "Referenced medicines are updated in-place to preserve order_items foreign keys.",
      });
    } catch (err) {
      console.error("❌ ADMIN IMPORT FAILED", err);
      res.status(500).json({ success: false, error: "Inventory import failed" });
    }
  });
}
