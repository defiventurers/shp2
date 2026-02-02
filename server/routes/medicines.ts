import type { Express } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { desc } from "drizzle-orm";

export function registerMedicineRoutes(app: Express) {
  app.get("/api/medicines", async (req, res) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 50, 100); // SAFE DEFAULT
      const offset = (page - 1) * limit;

      const data = await db
        .select()
        .from(medicines)
        .orderBy(desc(medicines.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: db.fn.count() })
        .from(medicines);

      res.json({
        success: true,
        medicines: data,
        page,
        limit,
        total: Number(count),
        hasMore: offset + limit < Number(count),
      });
    } catch (err) {
      console.error("FETCH MEDICINES ERROR:", err);
      res.status(500).json({ success: false });
    }
  });
}