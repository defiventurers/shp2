import type { Express, Request, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* -----------------------------
     Create Order (AUTH REQUIRED)
  ------------------------------ */
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.auth_token;
      if (!token) {
        return res.status(401).json({ error: "Unauthorised" });
      }

      const user = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        name?: string;
      };

      const {
        items,
        total,
        deliveryType,
        address,
        phone,
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items in order" });
      }

      const orderId = nanoid(10);

      /* -----------------------------
         Insert Order
      ------------------------------ */
      const [order] = await db
        .insert(orders)
        .values({
          id: orderId,
          orderNumber: `ORD-${Date.now()}`,
          userId: user.id,
          total: total.toString(),
          status: "pending",
          deliveryType,
          address: address ?? null,
          phone: phone ?? null,
          createdAt: new Date(),
        })
        .returning();

      /* -----------------------------
         Insert Order Items
      ------------------------------ */
      const itemsToInsert = items.map((item: any) => ({
        id: nanoid(10),
        orderId: order.id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        price: item.price.toString(),
      }));

      await db.insert(orderItems).values(itemsToInsert);

      res.json({ success: true, order });
    } catch (err) {
      console.error("❌ ORDER CREATE FAILED:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  /* -----------------------------
     Get User Orders
  ------------------------------ */
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.auth_token;
      if (!token) {
        return res.status(401).json({ error: "Unauthorised" });
      }

      const user = jwt.verify(token, JWT_SECRET) as { id: string };

      const userOrders = await db.query.orders.findMany({
        where: (o, { eq }) => eq(o.userId, user.id),
        with: {
          items: true,
        },
        orderBy: (o, { desc }) => desc(o.createdAt),
      });

      res.json(userOrders);
    } catch (err) {
      console.error("❌ FETCH ORDERS FAILED:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
}