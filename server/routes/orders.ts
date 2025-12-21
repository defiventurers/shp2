import type { Express, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  // CREATE ORDER
  app.post("/api/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      // @ts-ignore
      const user = req.user;

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

      const orderItemsData = items.map((item: any) => ({
        orderId: order.id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        price: item.price,
      }));

      await db.insert(orderItems).values(orderItemsData);

      res.json({
        success: true,
        orderNumber: order.id,
      });
    } catch (err) {
      console.error("Order creation failed:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // GET USER ORDERS
  app.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user;

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