import type { Express } from "express";
import { db } from "../db";
import { categories } from "@shared/schema";

export function registerCategoryRoutes(app: Express) {
  app.get("/api/categories", async (_req, res) => {
    const data = await db.select().from(categories);
    res.json({ success: true, categories: data });
  });
}
