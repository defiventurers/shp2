import type { Express, Request, Response } from "express";
import { db } from "../db";
import { categories } from "@shared/schema";

const INVENTORY_CATEGORIES = [
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
    const rows = await db.select().from(categories);

    const filtered = rows.filter((c) =>
      INVENTORY_CATEGORIES.includes(c.name.toUpperCase())
    );

    res.json({
      categories: filtered,
    });
  });
}