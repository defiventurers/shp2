import type { Express } from "express";
import { db } from "../db";
import { medicines } from "@shared/schema";

export function registerMedicineRoutes(app: Express) {
  app.get("/api/medicines", async (_req, res) => {
    const data = await db.select().from(medicines);
    res.json({ success: true, medicines: data });
  });
}
