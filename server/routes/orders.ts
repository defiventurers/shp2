import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq } from "drizzle-orm";

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* =========================
     CREATE ORDER
  ========================= */
  app.post(
    "/api/orders",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const {
          items,
          total,
          deliveryType,
          deliveryAddress,
        } = req.body;

        if (!items || !items.length) {
          return res
            .status(400)
            .json({ error: "Order items are required" });
        }

        const order = await db
          .insert(orders)
          .values({
            userId: req.user!.id,
            total,
            deliveryType,
            deliveryAddress: deliveryAddress || null,
            status: "pending",
          })
          .returning();

        const orderId = order[0].id;

        await db.insert(orderItems).values(
          items.map((item: any) => ({
            orderId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            price: item.price,
          }))
        );

        res.json({
          success: true,
          order: order[0],
        });
      } catch (err) {
        console.error("CREATE ORDER ERROR:", err);
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  );

  /* =========================
     GET ORDERS (CUSTOMER / STAFF)
  ========================= */
  app.get(
    "/api/orders",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const isStaff = req.headers["x-staff-auth"] === "true";

        const data = isStaff
          ? await db.query.orders.findMany({
              with: { items: true },
              orderBy: (o, { desc }) => [desc(o.createdAt)],
            })
          : await db.query.orders.findMany({
              where: eq(orders.userId, req.user!.id),
              with: { items: true },
              orderBy: (o, { desc }) => [desc(o.createdAt)],
            });

        res.json({
          success: true,
          orders: data,
        });
      } catch (err) {
        console.error("FETCH ORDERS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    }
  );
}