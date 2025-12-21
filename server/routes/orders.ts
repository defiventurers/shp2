import type { Express, Request, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "../db";
import { nanoid } from "nanoid";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  // Create order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const {
        items,
        total,
        deliveryType,
        address,
        phone,
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No items in order" });
      }

      const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;

      const [order] = await db
        .insert(orders)
        .values({
          orderNumber,
          total,
          deliveryType,
          address,
          phone,
          status: "pending",
        })
        .returning();

      const itemsToInsert = items.map((item: any) => ({
        orderId: order.id,
        medicineId: item.medicine.id,
        medicineName: item.medicine.name,
        quantity: item.quantity,
        price: item.medicine.price,
      }));

      await db.insert(orderItems).values(itemsToInsert);

      res.json({ success: true, order });
    } catch (err) {
      console.error("Order creation failed:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // Get orders (for frontend)
  app.get("/api/orders", async (_req, res) => {
    try {
      const allOrders = await db.query.orders.findMany({
        with: {
          items: true,
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });

      res.json(allOrders);
    } catch (err) {
      console.error("Fetching orders failed:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
}
