import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

function getUserFromRequest(req: Request) {
  const token = req.cookies?.auth_token;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { id: string };
  } catch {
    return null;
  }
}

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* -----------------------------
     CREATE ORDER
  ------------------------------ */
  app.post("/api/orders", async (req: Request, res: Response) => {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
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
          notes,
        })
        .returning();

      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: order.id,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: item.quantity,
          price: item.price,
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

  /* -----------------------------
     GET USER ORDERS
  ------------------------------ */
  app.get("/api/orders", async (req: Request, res: Response) => {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: { items: true },
      orderBy: [desc(orders.createdAt)],
    });

    res.json(result);
  });
}