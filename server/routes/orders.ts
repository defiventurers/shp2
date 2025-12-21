import type { Express, Request, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* -----------------------------
   Helper: get user from cookie
------------------------------ */
function getUser(req: Request) {
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
     GET /api/orders
     (user order history)
  ------------------------------ */
  app.get("/api/orders", async (req: Request, res: Response) => {
    const user = getUser(req);
    if (!user) return res.status(401).json([]);

    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: {
        items: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    res.json(userOrders);
  });

  /* -----------------------------
     POST /api/orders
     (place order)
  ------------------------------ */
  app.post("/api/orders", async (req: Request, res: Response) => {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const {
      items,
      total,
      deliveryType,
      address,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: "No items in order" });
    }

    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        total,
        status: "pending",
        deliveryType,
        address,
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

    res.json({ success: true, orderId: order.id });
  });
}
