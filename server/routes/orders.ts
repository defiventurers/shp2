import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* =========================
     CREATE ORDER  ✅ FIXED
  ========================= */
  app.post(
    "/api/orders",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
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
          prescriptionId,
        } = req.body;

        // ✅ HARD VALIDATION (BODY FIRST)
        if (!customerName || !customerPhone) {
          return res.status(400).json({
            error: "Name and phone number are required to place an order",
          });
        }

        if (!items || items.length === 0) {
          return res.status(400).json({
            error: "Order must contain at least one item",
          });
        }

        const orderNumber = `ORD-${Date.now()}`;

        const [order] = await db
          .insert(orders)
          .values({
            orderNumber,
            userId: req.user!.id,
            customerName,
            customerPhone,
            customerEmail: customerEmail || null,
            deliveryType,
            deliveryAddress: deliveryAddress || null,
            subtotal,
            deliveryFee,
            total,
            prescriptionId: prescriptionId || null,
          })
          .returning();

        // ✅ INSERT ITEMS
        for (const item of items) {
          await db.insert(orderItems).values({
            orderId: order.id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          });
        }

        res.json({
          success: true,
          orderNumber: order.orderNumber,
        });
      } catch (err) {
        console.error("❌ CREATE ORDER ERROR:", err);
        res.status(500).json({
          error: "Failed to create order",
        });
      }
    }
  );

  /* =========================
     GET ORDERS
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

        res.json({ success: true, orders: data });
      } catch (err) {
        console.error("FETCH ORDERS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    }
  );
}