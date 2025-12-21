import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import * as schema from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* -----------------------------
     CREATE ORDER
  ------------------------------ */
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      console.log("🧪 ORDER HIT");

      /* ---- LOG COOKIES ---- */
      console.log("🧪 COOKIES:", req.cookies);

      const token = req.cookies?.auth_token;
      if (!token) {
        console.error("❌ NO AUTH TOKEN");
        return res.status(401).json({ error: "Unauthorised" });
      }

      /* ---- VERIFY JWT ---- */
      let user: any;
      try {
        user = jwt.verify(token, JWT_SECRET);
        console.log("🧪 USER FROM TOKEN:", user);
      } catch (err) {
        console.error("❌ JWT VERIFY FAILED", err);
        return res.status(401).json({ error: "Invalid token" });
      }

      /* ---- LOG BODY ---- */
      console.log("🧪 BODY:", JSON.stringify(req.body, null, 2));

      const {
        items,
        total,
        deliveryType,
        address,
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        console.error("❌ INVALID ITEMS");
        return res.status(400).json({ error: "Invalid order items" });
      }

      /* ---- CREATE ORDER ---- */
      console.log("🧪 INSERTING ORDER...");

      const [order] = await db
        .insert(schema.orders)
        .values({
          userId: user.id,
          total: total.toString(),
          deliveryType,
          address,
          status: "pending",
        })
        .returning();

      console.log("✅ ORDER INSERTED:", order);

      /* ---- CREATE ORDER ITEMS ---- */
      const orderItems = items.map((item: any) => ({
        orderId: order.id,
        medicineId: item.medicine.id,
        medicineName: item.medicine.name,
        quantity: item.quantity,
        price: item.medicine.price,
      }));

      await db.insert(schema.orderItems).values(orderItems);

      console.log("✅ ORDER ITEMS INSERTED");

      res.json({ success: true, order });
    } catch (err) {
      console.error("❌ ORDER FAILED:", err);
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

      const user: any = jwt.verify(token, JWT_SECRET);

      const orders = await db.query.orders.findMany({
        where: (orders, { eq }) => eq(orders.userId, user.id),
        with: {
          items: true,
        },
        orderBy: (orders, { desc }) => desc(orders.createdAt),
      });

      res.json(orders);
    } catch (err) {
      console.error("❌ FETCH ORDERS FAILED:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
}