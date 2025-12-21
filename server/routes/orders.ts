import type { Express, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { eq } from "drizzle-orm";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  // CREATE ORDER
  app.post("/api/orders", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;

      const {
        items,
        total,
        customerName,
        customerPhone,
        notes,
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items" });
      }

      const [order] = await db
        .insert(orders)
        .values({
          userId: user.id,
          customerName,
          customerPhone,
          total,
          status: "pending",
        })
        .returning();

      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: order.id,
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          quantity: item.quantity,
          price: item.medicine.price,
        });
      }

      res.json({
        success: true,
        orderNumber: order.id,
      });
    } catch (err) {
      console.error("Order create error:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // GET USER ORDERS
  app.get("/api/orders", requireAuth, async (req: AuthRequest, res: Response) => {
    const user = req.user;

    const result = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: { items: true },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    res.json(result);
  });
}