import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq } from "drizzle-orm";

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* CREATE ORDER */
  app.post(
    "/api/orders",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        console.log("🟢 AUTH USER IN ORDER:", req.user);

        const user = req.user;
        if (!user?.id) {
          console.error("❌ NO USER ID");
          return res.status(401).json({ error: "Unauthorized (no user)" });
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

        console.log("📦 ORDER PAYLOAD:", req.body);

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

        console.log("✅ ORDER CREATED:", order.id);

        res.json({ success: true, orderNumber: order.id });
      } catch (err) {
        console.error("❌ ORDER ERROR:", err);
        res.status(500).json({ error: "Failed to place order" });
      }
    }
  );

  /* GET USER ORDERS */
  app.get("/api/orders", requireAuth, async (req: AuthRequest, res) => {
    console.log("🟢 FETCH ORDERS USER:", req.user);

    const user = req.user;
    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized (no user)" });
    }

    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, user.id),
      with: { items: true },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    res.json(userOrders);
  });
}