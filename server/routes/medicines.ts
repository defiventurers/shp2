import type { Express, Request, Response } from "express";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { normalizeToken, sourceTokensForCategory } from "../utils/categoryMapping";

export function registerMedicineRoutes(app: Express) {
  console.log("💊 MEDICINE ROUTES REGISTERED");

  app.get("/api/medicines", async (req: Request, res: Response) => {
    try {
      const search = req.query.q?.toString()?.trim();
      const categoryNameParam = normalizeToken(req.query.category?.toString());
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(60, Math.max(12, Number(req.query.limit || 24)));
      const offset = (page - 1) * limit;

      let categoryIdFilter: string | null = null;

      if (categoryNameParam) {
        const [cat] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(sql<boolean>`UPPER(${categories.name}) = ${categoryNameParam}`)
          .limit(1);

        categoryIdFilter = cat?.id || null;
      }

      const categoryMatch = categoryNameParam
        ? (() => {
            const sourceTokens = sourceTokensForCategory(categoryNameParam);
            const sourceConditions = sourceTokens.map((token) =>
              sql<boolean>`UPPER(COALESCE(${medicines.sourceFile}, 'OTHERS')) = ${token}`,
            );

            if (!categoryIdFilter) {
              return sourceConditions.length ? or(...sourceConditions) : undefined;
            }

            if (!sourceConditions.length) {
              return eq(medicines.categoryId, categoryIdFilter);
            }

            return or(eq(medicines.categoryId, categoryIdFilter), ...sourceConditions);
          })()
        : undefined;

      const searchMatch = search
        ? or(
            ilike(medicines.name, `%${search}%`),
            ilike(medicines.manufacturer, `%${search}%`),
          )
        : undefined;

      const whereBase = and(searchMatch, categoryMatch);

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
        .orderBy(medicines.name)
        .limit(limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(medicines)
        .where(whereBase);

      const total = Number(countRow?.count || 0);

      res.json({
        success: true,
        medicines: rows,
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
