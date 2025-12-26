import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems, users } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq } from "drizzle-orm";

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SHP-${date}-${rand}`;
}

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  app.post("/api/orders", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // ✅ ENSURE USER EXISTS
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      });

      if (!existingUser) {
        await db.insert(users).values({
          id: user.id,
          email: user.email ?? "dev@example.com",
          name: user.name ?? "Dev User",
        });
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
      } = req.body;

      const order_number = generateOrderNumber();

      const [order] = await db
        .insert(orders)
        .values({
          order_number,
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
          notes,
        })
        .returning();

      if (items?.length) {
        await db.insert(orderItems).values(
          items.map((item: any) => ({
            orderId: order.id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            price: item.price,
          }))
        );
      }

      res.json({
        success: true,
        orderNumber: order.order_number,
      });
    } catch (err) {
      console.error("ORDER ERROR:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  app.get("/api/orders", requireAuth, async (req: AuthRequest, res) => {
    const user = req.user;

    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: { items: true },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    res.json(userOrders);
  });
}