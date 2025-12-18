import type { Express } from "express";
import { db } from "../db";
import { orders } from "@shared/schema";

export function registerOrderRoutes(app: Express) {
  app.get("/api/orders", async (_req, res) => {
    const data = await db.select().from(orders);
    res.json({ success: true, orders: data });
  });
}
