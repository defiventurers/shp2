import type { Express } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { ilike } from "drizzle-orm";

export function registerMedicineRoutes(app: Express) {
  /**
   * GET /api/medicines
   *
   * Query params:
   * - page (default: 1)
   * - limit (default: 50, max: 100)
   * - q (search by medicine name)
   */
  app.get("/api/medicines", async (req, res) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = (page - 1) * limit;
      const q = (req.query.q as string | undefined)?.trim();

      let query = db
        .select()
        .from(medicines)
        .limit(limit)
        .offset(offset);

      if (q) {
        query = query.where(
          ilike(medicines.name, `%${q}%`)
        );
      }

      const results = await query;

      res.json({
        success: true,
        page,
        limit,
        count: results.length,
        medicines: results,
      });
    } catch (err) {
      console.error("❌ Failed to fetch medicines:", err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medicines",
      });
    }
  });
}