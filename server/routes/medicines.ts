import type { Express, Request, Response } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { asc, ilike, or } from "drizzle-orm";

export function registerMedicineRoutes(app: Express) {
  console.log("💊 MEDICINE ROUTES REGISTERED");

  /**
   * GET /api/medicines
   * Clean response + sourceFile included
   */
  app.get("/api/medicines", async (req: Request, res: Response) => {
    try {
      const search = req.query.search?.toString();
      const sourceFile = req.query.sourceFile?.toString();

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(medicines.name, `%${search}%`),
            ilike(medicines.manufacturer, `%${search}%`)
          )
        );
      }

      if (sourceFile) {
        conditions.push(ilike(medicines.sourceFile, `%${sourceFile}%`));
      }

      const query = db
        .select({
          id: medicines.id,
          name: medicines.name,
          manufacturer: medicines.manufacturer,
          price: medicines.price,
          mrp: medicines.mrp,
          packSize: medicines.packSize,
          requiresPrescription: medicines.requiresPrescription,
          isScheduleH: medicines.isScheduleH,
          imageUrl: medicines.imageUrl,
          sourceFile: medicines.sourceFile,
          createdAt: medicines.createdAt,
          updatedAt: medicines.updatedAt,
        })
        .from(medicines)
        .orderBy(asc(medicines.name))
        .limit(100);

      if (conditions.length > 0) {
        query.where(or(...conditions));
      }

      const rows = await query;

      res.json({
        success: true,
        medicines: rows,
      });
    } catch (err) {
      console.error("❌ Failed to fetch medicines:", err);
      res.status(500).json({ success: false });
    }
  });
}