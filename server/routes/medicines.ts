import type { Express, Request, Response } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

export function registerMedicineRoutes(app: Express) {
  console.log("💊 MEDICINE ROUTES REGISTERED");

  app.get("/api/medicines", async (req: Request, res: Response) => {
    try {
      const search = req.query.q?.toString();

      const rows = await db
        .select({
          id: medicines.id,
          name: medicines.name,
          manufacturer: medicines.manufacturer,
          packSize: medicines.packSize,
          price: medicines.price,
          imageUrl: medicines.imageUrl,
          categoryId: medicines.categoryId,
          requiresPrescription: medicines.requiresPrescription,
          sourceFile: medicines.sourceFile,
        })
        .from(medicines)
        .where(
          search
            ? ilike(medicines.name, `%${search}%`)
            : undefined
        );

      res.json({ success: true, medicines: rows });
    } catch (err) {
      console.error("❌ Failed to fetch medicines:", err);
      res.status(500).json({ success: false });
    }
  });
}