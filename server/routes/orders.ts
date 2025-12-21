import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function requireAuth(req: Request, res: Response) {
  const token = req.cookies?.auth_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name?: string;
    };
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* CREATE ORDER */
  app.post("/api/orders", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    try {
      const {
        items,
        subtotal,
        deliveryFee,
        total,
        deliveryType,
        deliveryAddress,
        customerName,
        customerPhone,
        customerEmail,
        notes,
      } = req.body;

      const [order] = await db
        .insert(orders)
        .values({
          userId: user.id,
          customerName,
          customerPhone,
          customerEmail,
          deliveryType,
          deliveryAddress,
          subtotal,
          deliveryFee,
          total,
          status: "pending",
        })
        .returning();

      await db.insert(orderItems).values(
        items.map((item: any) => ({
          orderId: order.id,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: item.quantity,
          price: item.price,
        }))
      );

      res.json({
        success: true,
        orderNumber: order.id,
      });
    } catch (err) {
      console.error("Order error:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  /* GET MY ORDERS */
  app.get("/api/orders", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: {
        items: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    res.json(result);
  });
}