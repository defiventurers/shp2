import type { Express } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

export function registerMedicineRoutes(app: Express) {
  app.get("/api/medicines", async (req, res) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = (page - 1) * limit;

      const [rows, countResult] = await Promise.all([
        db
          .select()
          .from(medicines)
          .orderBy(desc(medicines.createdAt))
          .limit(limit)
          .offset(offset),

        db
          .select({ count: sql<number>`count(*)` })
          .from(medicines),
      ]);

      const total = Number(countResult[0].count);
      const hasMore = offset + rows.length < total;

      res.json({
        success: true,
        medicines: rows,
        page,
        limit,
        total,
        hasMore,
      });
    } catch (err) {
      console.error("MEDICINES FETCH ERROR:", err);
      res.status(500).json({ error: "Failed to fetch medicines" });
    }
  });
}