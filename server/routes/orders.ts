import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { eq } from "drizzle-orm";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* -----------------------------
   Auth middleware
------------------------------ */
function requireAuth(req: Request, res: Response) {
  const token = req.cookies?.auth_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { id: string };
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}

/* -----------------------------
   Routes
------------------------------ */
export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* Get user orders */
  app.get("/api/orders", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: {
        items: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    res.json(userOrders);
  });

  /* Create order */
  app.post("/api/orders", async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const { items, total, deliveryType } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order items" });
    }

    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        total,
        deliveryType,
        status: "pending",
      })
      .returning();

    const itemRows = items.map((item: any) => ({
      orderId: order.id,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      quantity: item.quantity,
      price: item.price,
    }));

    await db.insert(orderItems).values(itemRows);

    res.json({ success: true, orderId: order.id });
  });
}