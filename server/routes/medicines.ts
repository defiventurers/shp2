import type { Express } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { sql } from "drizzle-orm";

export function registerMedicineRoutes(app: Express) {
  console.log("💊 MEDICINE ROUTES REGISTERED");

  /**
   * GET /api/medicines
   * Pagination-safe, production-ready
   *
   * Query params:
   * - page (default: 1)
   * - limit (default: 50, max: 100)
   */
  app.get("/api/medicines", async (req, res) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = (page - 1) * limit;

      // 🔎 TOTAL COUNT (FOR DEBUG + PAGINATION)
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(medicines);

      // 📦 PAGINATED QUERY
      const data = await db
        .select()
        .from(medicines)
        .limit(limit)
        .offset(offset);

      console.log(
        `📦 Medicines API → page=${page}, limit=${limit}, returned=${data.length}, total=${count}`
      );

      res.json({
        success: true,
        medicines: data,
        pagination: {
          page,
          limit,
          total: Number(count),
          totalPages: Math.ceil(Number(count) / limit),
        },
      });
    } catch (err) {
      console.error("❌ FETCH MEDICINES ERROR:", err);
      res.status(500).json({
        success: false,
        error: "Failed to fetch medicines",
      });
    }
  });
}