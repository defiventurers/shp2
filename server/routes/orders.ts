import type { Express } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  // CREATE ORDER (AUTH REQUIRED)
  app.post("/api/orders", requireAuth, async (req: AuthRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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
      prescriptionId,
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
        notes,
        prescriptionId,
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

    res.json(order);
  });

  // GET USER ORDERS
  app.get("/api/orders", requireAuth, async (req: AuthRequest, res) => {
    const user = req.user;

    const userOrders = await db.query.orders.findMany({
      where: (orders, { eq }) => eq(orders.userId, user.id),
      with: {
        items: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    res.json(userOrders);
  });
}