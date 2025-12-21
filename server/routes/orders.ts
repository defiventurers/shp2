import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* -----------------------------
     CREATE ORDER
  ------------------------------ */
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.auth_token;

      if (!token) {
        return res.status(401).json({ error: "Unauthorised" });
      }

      let user: any;
      try {
        user = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      const {
        items,
        total,
        deliveryType,
        address,
        phone,
        deliveryFee,
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items in order" });
      }

      // Create order
      const [order] = await db
        .insert(orders)
        .values({
          userId: user.id,
          total,
          deliveryType,
          address,
          phone,
          deliveryFee,
          status: "pending",
        })
        .returning();

      // Create order items
      const orderItemsData = items.map((item: any) => ({
        orderId: order.id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        price: item.price,
      }));

      await db.insert(orderItems).values(orderItemsData);

      res.json({ success: true, orderId: order.id });
    } catch (err) {
      console.error("Order creation failed:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  /* -----------------------------
     GET USER ORDERS
  ------------------------------ */
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.auth_token;

      if (!token) {
        return res.status(401).json({ error: "Unauthorised" });
      }

      let user: any;
      try {
        user = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, user.id),
        with: {
          items: true,
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });

      res.json(userOrders);
    } catch (err) {
      console.error("Fetching orders failed:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
}
