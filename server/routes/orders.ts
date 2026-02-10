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
        const user = req.user;

        if (!user) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const {
          items,
          deliveryType,
          deliveryAddress,
          subtotal,
          deliveryFee,
          total,
          prescriptionId,
          notes,
        } = req.body;

        /* ---------- HARD VALIDATION ---------- */

        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: "Order must contain items" });
        }

        if (!user.firstName || !user.phone) {
          return res.status(400).json({
            error: "Name and phone number are required to place an order",
          });
        }

        if (!deliveryType) {
          return res.status(400).json({ error: "Delivery type is required" });
        }

        if (deliveryType === "delivery" && !deliveryAddress) {
          return res
            .status(400)
            .json({ error: "Delivery address is required" });
        }

        /* ---------- ORDER NUMBER ---------- */
        const orderNumber = `ORD-${Date.now()}`;

        /* ---------- CREATE ORDER ---------- */
        const [order] = await db
          .insert(orders)
          .values({
            orderNumber,
            userId: user.id,
            customerName: user.firstName,
            customerPhone: user.phone,
            customerEmail: user.email ?? null,
            deliveryType,
            deliveryAddress: deliveryAddress ?? null,
            subtotal,
            deliveryFee,
            total,
            status: "pending",
            prescriptionId: prescriptionId ?? null,
            notes: notes ?? null,
          })
          .returning();

        /* ---------- CREATE ORDER ITEMS ---------- */
        for (const item of items) {
          await db.insert(orderItems).values({
            orderId: order.id,
            medicineId: item.medicineId ?? null,
            medicineName: item.medicineName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          });
        }

        res.json({
          success: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
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