import type { Express, Request, Response } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";
import { asc } from "drizzle-orm";

export function registerMedicineRoutes(app: Express) {
  console.log("💊 MEDICINE ROUTES REGISTERED");

  app.get("/api/medicines", async (_req: Request, res: Response) => {
    try {
      const data = await db
        .select({
          id: medicines.id,
          name: medicines.name,
          manufacturer: medicines.manufacturer,
          packSize: medicines.packSize,
          price: medicines.price,
          mrp: medicines.mrp,
          requiresPrescription: medicines.requiresPrescription,
          isScheduleH: medicines.isScheduleH,
          imageUrl: medicines.imageUrl,
          sourceFile: medicines.sourceFile,
        })
        .from(medicines)
        .orderBy(asc(medicines.name));

      res.json({ success: true, medicines: data });
    } catch (err) {
      console.error("❌ Failed to fetch medicines:", err);
      res.status(500).json({ success: false });
    }
  });
}