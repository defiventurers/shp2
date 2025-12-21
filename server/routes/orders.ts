import type { Express, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* GET user orders */
  app.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user;

    const userOrders = await db.query.orders.findMany({
      where: (o, { eq }) => eq(o.userId, user.id),
      with: {
        items: true,
      },
      orderBy: (o, { desc }) => desc(o.createdAt),
    });

    res.json(userOrders);
  });

  /* CREATE order */
  app.post("/api/orders", requireAuth, async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user;

    const { items, total, deliveryType } = req.body;

    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        total,
        deliveryType,
        status: "pending",
      })
      .returning();

    const orderItemValues = items.map((item: any) => ({
      orderId: order.id,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      quantity: item.quantity,
      price: item.price,
    }));

    await db.insert(orderItems).values(orderItemValues);

    res.json({ success: true, orderId: order.id });
  });
}