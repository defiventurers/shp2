import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { orders, orderItems } from "../schema";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* -----------------------------
   Helpers
------------------------------ */
function getUserFromRequest(req: Request) {
  const token = req.cookies?.auth_token;
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name?: string;
    };
  } catch {
    return null;
  }
}

/* -----------------------------
   Routes
------------------------------ */
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

    const { items, total, deliveryType, address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No order items" });
    }

    const orderNumber = `ORD-${Date.now()}`;

    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        orderNumber,
        total,
        status: "pending",
        deliveryType,
        address,
        createdAt: new Date(),
      })
      .returning();

    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        price: item.price,
        quantity: item.quantity,
      });
    }

    res.json({ success: true, order });
  });

  /* -----------------------------
     GET MY ORDERS
  ------------------------------ */
  app.get("/api/orders", async (req: Request, res: Response) => {
    const user = getUserFromRequest(req);

    if (!user) {
      return res.json([]);
    }

    const userOrders = await db.query.orders.findMany({
      where: (orders, { eq }) => eq(orders.userId, user.id),
      with: {
        items: true,
      },
      orderBy: (orders, { desc }) => desc(orders.createdAt),
    });

    res.json(userOrders);
  });
}
