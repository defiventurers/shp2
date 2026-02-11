import type { Express, Request, Response } from "express";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";
import { and, eq, ilike, sql } from "drizzle-orm";

const SOURCE_TO_CATEGORY: Record<string, string> = {
  TABLETS: "TABLETS",
  CAPSULES: "CAPSULES",
  SYRUPS: "SYRUPS",
  INJECTIONS: "INJECTIONS",
  "DIABETIC INJECTIONS": "INJECTIONS",
  TOPICALS: "TOPICALS",
  DROPS: "DROPS",
  POWDERS: "POWDERS",
  MOUTHWASH: "MOUTHWASH",
  INHALERS: "INHALERS",
  DEVICES: "DEVICES",
  SCRUBS: "SCRUBS",
  SOLUTIONS: "SOLUTIONS",
  OTHERS: "NO CATEGORY",
  "NO CATEGORY": "NO CATEGORY",
};

function normalizeSourceFile(value: string | null | undefined): string {
  return (value || "").trim().toUpperCase();
}

export function registerMedicineRoutes(app: Express) {
  console.log("💊 MEDICINE ROUTES REGISTERED");

  app.get("/api/medicines", async (req: Request, res: Response) => {
    try {
      const search = req.query.q?.toString()?.trim();
      const categoryNameParam = req.query.category
        ?.toString()
        ?.trim()
        .toUpperCase();
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(60, Math.max(12, Number(req.query.limit || 24)));
      const offset = (page - 1) * limit;

      let categoryIdFilter: string | null = null;

      if (categoryNameParam) {
        const [cat] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.name, categoryNameParam))
          .limit(1);

        categoryIdFilter = cat?.id || null;
      }

      const whereBase = and(
        search ? ilike(medicines.name, `%${search}%`) : undefined,
        categoryNameParam && categoryIdFilter
          ? eq(medicines.categoryId, categoryIdFilter)
          : undefined
      );

      const rows = await db
        .select({
          id: medicines.id,
          name: medicines.name,
          manufacturer: medicines.manufacturer,
          packSize: medicines.packSize,
          price: medicines.price,
          imageUrl: medicines.imageUrl,
          categoryId: medicines.categoryId,
          requiresPrescription: medicines.requiresPrescription,
          sourceFile: medicines.sourceFile,
        })
        .from(medicines)
        .where(whereBase)
        .limit(limit)
        .offset(offset);

      let finalRows = rows;
      let total = 0;

      if (categoryNameParam && !categoryIdFilter) {
        const fallbackCategory = categoryNameParam;

        const fullSearchRows = await db
          .select({
            id: medicines.id,
            name: medicines.name,
            manufacturer: medicines.manufacturer,
            packSize: medicines.packSize,
            price: medicines.price,
            imageUrl: medicines.imageUrl,
            categoryId: medicines.categoryId,
            requiresPrescription: medicines.requiresPrescription,
            sourceFile: medicines.sourceFile,
          })
          .from(medicines)
          .where(search ? ilike(medicines.name, `%${search}%`) : undefined);

        const filtered = fullSearchRows.filter((m) => {
          const mapped =
            SOURCE_TO_CATEGORY[normalizeSourceFile(m.sourceFile)] || "NO CATEGORY";
          return mapped === fallbackCategory;
        });

        total = filtered.length;
        finalRows = filtered.slice(offset, offset + limit);
      } else {
        const countWhere = and(
          search ? ilike(medicines.name, `%${search}%`) : undefined,
          categoryNameParam && categoryIdFilter
            ? eq(medicines.categoryId, categoryIdFilter)
            : undefined
        );

        const [countRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(medicines)
          .where(countWhere);

        total = Number(countRow?.count || 0);
      }

      res.json({
        success: true,
        medicines: finalRows,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (err) {
      console.error("❌ Failed to fetch medicines:", err);
      res.status(500).json({ success: false });
    }
  });
}
