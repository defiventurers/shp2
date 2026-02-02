import type { Express, Request, Response } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { desc } from "drizzle-orm";

export function registerMedicineRoutes(app: Express) {
  console.log("💊 MEDICINE ROUTES REGISTERED");

  /**
   * GET /api/medicines
   * Query params:
   *   page (default: 1)
   *   limit (default: 50, max: 100)
   */
  app.get("/api/medicines", async (req: Request, res: Response) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(
        Math.max(parseInt(req.query.limit as string) || 50, 1),
        100
      );

      const offset = (page - 1) * limit;

      // Total count (for UI pagination)
      const [{ count }] = await db
        .select({ count: db.fn.count() })
        .from(medicines);

      // Paginated data
      const data = await db
        .select()
        .from(medicines)
        .orderBy(desc(medicines.createdAt)) // stable ordering
        .limit(limit)
        .offset(offset);

      res.json({
        success: true,
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
        medicines: data,
      });
    } catch (err) {
      console.error("MEDICINE FETCH ERROR:", err);
      res.status(500).json({ error: "Failed to fetch medicines" });
    }
  });
}