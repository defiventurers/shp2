import type { Express, Request, Response } from "express";
import { db } from "../db";
import { medicines, categories } from "@shared/schema";
import { and, eq, ilike, sql } from "drizzle-orm";

function deriveCategoryFromName(name: string): string {
  const upper = (name || "").toUpperCase();
  if (upper.includes("TAB") || upper.includes("TABLET")) return "TABLETS";
  if (upper.includes("CAP") || upper.includes("CAPSULE")) return "CAPSULES";
  if (upper.includes("SYR") || upper.includes("SYP")) return "SYRUPS";
  if (upper.includes("INJ") || upper.includes("VIAL")) return "INJECTIONS";
  if (upper.includes("DROP")) return "DROPS";
  if (upper.includes("INHAL")) return "INHALERS";
  if (upper.includes("MOUTHWASH")) return "MOUTHWASH";
  if (upper.includes("POWDER")) return "POWDERS";
  if (upper.includes("GEL") || upper.includes("CREAM") || upper.includes("OINT"))
    return "TOPICALS";
  return "NO CATEGORY";
}

export function registerMedicineRoutes(app: Express) {
  console.log("💊 MEDICINE ROUTES REGISTERED");

  app.get("/api/medicines", async (req: Request, res: Response) => {
    try {
      const search = req.query.q?.toString()?.trim();
      const categoryName = req.query.category?.toString()?.trim().toUpperCase();
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(60, Math.max(12, Number(req.query.limit || 24)));
      const offset = (page - 1) * limit;

      const where = and(
        search ? ilike(medicines.name, `%${search}%`) : undefined
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
          categoryName: categories.name,
          requiresPrescription: medicines.requiresPrescription,
          sourceFile: medicines.sourceFile,
        })
        .from(medicines)
        .leftJoin(categories, eq(medicines.categoryId, categories.id))
        .where(where)
        .limit(5000); // keep query bounded before in-memory fallback category filtering

      const enriched = rows.map((m) => ({
        ...m,
        categoryName: m.categoryName || deriveCategoryFromName(m.name || ""),
      }));

      const filteredByCategory = categoryName
        ? enriched.filter((m) => (m.categoryName || "NO CATEGORY") === categoryName)
        : enriched;

      const total = filteredByCategory.length;
      const paginated = filteredByCategory.slice(offset, offset + limit);

      res.json({
        success: true,
        medicines: paginated,
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
