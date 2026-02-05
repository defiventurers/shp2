import type { Express, Request, Response } from "express";
import { db } from "../db";
import { categories } from "@shared/schema";
import { inArray } from "drizzle-orm";

/**
 * ONLY categories allowed for inventory filtering
 * Must match CSV + seeded categories (ALL CAPS)
 */
const INVENTORY_CATEGORY_NAMES = [
  "TABLETS",
  "CAPSULES",
  "SYRUPS",
  "INJECTIONS",
  "TOPICALS",
  "DROPS",
  "POWDERS",
  "MOUTHWASH",
  "INHALERS",
  "DEVICES",
  "SCRUBS",
  "SOLUTIONS",
  "NO CATEGORY",
];

export function registerCategoryRoutes(app: Express) {
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(categories)
        .where(inArray(categories.name, INVENTORY_CATEGORY_NAMES))
        .orderBy(categories.name);

      res.json({ categories: rows });
    } catch (err) {
      console.error("❌ CATEGORY FETCH FAILED", err);
      res.status(500).json({ error: "Failed to load categories" });
    }
  });
}