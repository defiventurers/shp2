import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { eq, inArray, sql } from "drizzle-orm";
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
const IMPORT_KEY_PREFIX = "IMPORT_KEY:";

const CATEGORY_ALIAS_MAP: Record<string, string> = {
  TABLET: "TABLETS",
  CAPSULE: "CAPSULES",
  INJECTION: "INJECTIONS",
  SYRUP: "SYRUPS",
  DROP: "DROPS",
  POWDER: "POWDERS",
  SOLUTION: "SOLUTIONS",
  SCRUB: "SCRUBS",
  INHALER: "INHALERS",
  DEVICE: "DEVICES",
  "MOUTH WASH": "MOUTHWASH",
  "MOUTH-WASH": "MOUTHWASH",
};

function normalizeText(rawValue: unknown): string {
  return String(rawValue ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function normalizeCategory(rawCategory: unknown): { normalized: string; normalizedInput: string; forcedInvalid: boolean } {
  const normalizedInput = normalizeText(rawCategory);

  if (!normalizedInput) {
    return {
      normalized: "NO CATEGORY",
      normalizedInput,
      forcedInvalid: false,
    };
  }

  const aliased = CATEGORY_ALIAS_MAP[normalizedInput] ?? normalizedInput;

  if (!DOSAGE_FORM_ALLOWLIST.has(aliased)) {
    return {
      normalized: "NO CATEGORY",
      normalizedInput,
      forcedInvalid: true,
    };
  }

  return {
    normalized: aliased,
    normalizedInput,
    forcedInvalid: false,
  };
}

function extractImportKey(sourceFile: string | null | undefined): string | null {
  const token = String(sourceFile ?? "");
  const markerIndex = token.indexOf(IMPORT_KEY_PREFIX);

  if (markerIndex === -1) {
    return null;
  }

  return token.slice(markerIndex + IMPORT_KEY_PREFIX.length).trim() || null;
}

function buildIdentityBaseKey(
  name: string,
  manufacturer: string,
  packSize: number,
  price: number,
  imageUrl: string,
  sourceToken: string,
): string {
  return [
    normalizeText(name),
    normalizeText(manufacturer),
    String(packSize),
    Number(price).toFixed(2),
    normalizeText(imageUrl),
    normalizeText(sourceToken),
  ].join("|");
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

      const dosageCategories = await db
        .select()
        .from(categories)
        .where(inArray(categories.name, [...DOSAGE_FORM_CATEGORIES]));

      const categoryMap = new Map<string, string>();
      for (const c of dosageCategories) {
        categoryMap.set(normalizeText(c.name), c.id);
      }

      console.log("📦 Loaded dosage categories:", [...categoryMap.keys()]);

      const existingMedicines = await db
        .select({
          id: medicines.id,
          name: medicines.name,
          manufacturer: medicines.manufacturer,
          packSize: medicines.packSize,
          price: medicines.price,
          imageUrl: medicines.imageUrl,
          sourceFile: medicines.sourceFile,
        })
        .from(medicines);

      const existingByImportKey = new Map<string, string>();
      const legacyBuckets = new Map<string, string[]>();

      for (const row of existingMedicines) {
        const existingImportKey = extractImportKey(row.sourceFile);
        if (existingImportKey) {
          existingByImportKey.set(existingImportKey, row.id);
        }

        const legacyKey = medicineKey(row.name || "", row.manufacturer || "NOT KNOWN", row.packSize || 0);
        const bucket = legacyBuckets.get(legacyKey) || [];
        bucket.push(row.id);
        legacyBuckets.set(legacyKey, bucket);
      }

      const consumedLegacyIds = new Set<string>();

      let totalRowsProcessed = 0;
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let forcedNoCategoryCount = 0;
      let collisionsPrevented = 0;

      const categoryStats = new Map<string, number>();
      const invalidCategoryValues = new Set<string>();
      const unknownDbCategoryValues = new Set<string>();
      const loggedUnknownDbCategories = new Set<string>();
      const identityOccurrences = new Map<string, number>();
      const identityDuplicateCounts = new Map<string, number>();
      const insertBatch: any[] = [];
      const updateBatch: Array<{ id: string; payload: any }> = [];
      const BATCH_SIZE = 250;
      let headersLogged = false;

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

        if (!headersLogged) {
          console.log("🧾 CSV headers detected:", Object.keys(row));
          headersLogged = true;
        }

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
          const categoryInput = rawCategory || rawSourceFile;
          const categoryResolution = normalizeCategory(categoryInput);

          let normalizedCategory = categoryResolution.normalized;

          if (categoryResolution.forcedInvalid) {
            forcedNoCategoryCount++;
            invalidCategoryValues.add(categoryResolution.normalizedInput);
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

          const identityBaseKey = buildIdentityBaseKey(
            name,
            manufacturer,
            normalizedPackSize,
            price,
            imageUrl,
            sourceToken,
          );
          const occurrence = (identityOccurrences.get(identityBaseKey) || 0) + 1;
          identityOccurrences.set(identityBaseKey, occurrence);

          if (occurrence > 1) {
            collisionsPrevented++;
            identityDuplicateCounts.set(identityBaseKey, occurrence);
          }

          const importKey = `${identityBaseKey}#${occurrence}`;

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
            sourceFile: `${sourceToken} | ${IMPORT_KEY_PREFIX}${importKey}`,
          };

          let targetId = existingByImportKey.get(importKey) || null;

          if (!targetId) {
            const legacyKey = medicineKey(name, manufacturer, normalizedPackSize);
            const bucket = legacyBuckets.get(legacyKey) || [];
            targetId = bucket.find((id) => !consumedLegacyIds.has(id)) || null;
          }

          if (targetId) {
            consumedLegacyIds.add(targetId);
            updateBatch.push({ id: targetId, payload });
          } else {
            insertBatch.push(payload);
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

      const duplicateKeysTop30 = [...identityDuplicateCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([key, count]) => ({ key, count }));

      console.log("✅ IMPORT COMPLETE");
      console.log(`📈 Total rows processed: ${totalRowsProcessed}`);
      console.log(`➕ Inserted: ${inserted}`);
      console.log(`🔁 Updated: ${updated}`);
      console.log(`⏭️ Skipped: ${skipped}`);
      console.log(`🔑 Distinct unique keys: ${identityOccurrences.size}`);
      console.log(`🧩 Unique-key duplicates encountered: ${collisionsPrevented}`);
      console.log("🧩 Duplicate unique keys (max 30):", duplicateKeysTop30);
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
        distinctUniqueKeys: identityOccurrences.size,
        duplicateUniqueKeysCount: collisionsPrevented,
        duplicateUniqueKeysTop30: duplicateKeysTop30,
        note: "Referenced medicines are updated in-place to preserve order_items foreign keys.",
      });
    } catch (err) {
      console.error("❌ ADMIN IMPORT FAILED", err);
      res.status(500).json({ success: false, error: "Inventory import failed" });
    }
  });
}
