import type { Express, Request, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* Create order */
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.auth_token;
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = jwt.verify(token, JWT_SECRET) as any;

      const { items, total, deliveryType } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid order items" });
      }

      // Insert order
      const [order] = await db
        .insert(orders)
        .values({
          userId: user.id,
          total,
          deliveryType,
          status: "pending",
        })
        .returning();

      // Insert order items
      await db.insert(orderItems).values(
        items.map((item: any) => ({
          orderId: order.id,
          medicineId: item.medicineId,
          medicineName: item.name,
          quantity: item.quantity,
          price: item.price,
        }))
      );

      res.json({ success: true, orderId: order.id });
    } catch (err) {
      console.error("❌ ORDER CREATE FAILED:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  /* Get user orders */
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.auth_token;
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = jwt.verify(token, JWT_SECRET) as any;

      const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, user.id),
        with: {
          items: true,
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });

      res.json(userOrders);
    } catch (err) {
      console.error("❌ FETCH ORDERS FAILED:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
}