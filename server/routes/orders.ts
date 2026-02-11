import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq } from "drizzle-orm";

async function sendOrderWhatsAppAlert(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: string | number;
  deliveryType: string;
}) {
  const text = `New order ${order.orderNumber}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\nTotal: ₹${order.total}\nType: ${order.deliveryType}`;

  const webhook = process.env.WHATSAPP_WEBHOOK_URL;

  if (!webhook) {
    console.log("ℹ️ WHATSAPP_WEBHOOK_URL not configured. Alert text:", text);
    return;
  }

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("⚠️ WhatsApp alert failed (non-blocking):", err);
  }
}

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

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
            adjustedTotal: total,
            discountAmount: "0",
            prescriptionId: prescriptionId || null,
          })
          .returning();

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

        sendOrderWhatsAppAlert({
          orderNumber: order.orderNumber,
          customerName,
          customerPhone,
          total,
          deliveryType,
        });

        res.json({
          success: true,
          orderNumber: order.orderNumber,
          status: order.status,
        });
      } catch (err) {
        console.error("❌ CREATE ORDER ERROR:", err);
        res.status(500).json({
          error: "Failed to create order",
        });
      }
    }
  );

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

  app.patch(
    "/api/orders/:id/status",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const isStaff = req.headers["x-staff-auth"] === "true";
        if (!isStaff) return res.status(403).json({ error: "Forbidden" });

        const { id } = req.params;
        const { status } = req.body;

        const [updated] = await db
          .update(orders)
          .set({ status, updatedAt: new Date() })
          .where(eq(orders.id, id))
          .returning();

        if (!updated) return res.status(404).json({ error: "Order not found" });

        res.json({ success: true, order: updated });
      } catch (err) {
        console.error("UPDATE STATUS ERROR:", err);
        res.status(500).json({ error: "Failed to update status" });
      }
    }
  );

  app.patch(
    "/api/orders/:id/billing",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const isStaff = req.headers["x-staff-auth"] === "true";
        if (!isStaff) return res.status(403).json({ error: "Forbidden" });

        const { id } = req.params;
        const { discountAmount } = req.body;

        const existing = await db.query.orders.findFirst({
          where: eq(orders.id, id),
        });

        if (!existing) return res.status(404).json({ error: "Order not found" });

        const subtotal = Number(existing.subtotal || 0) + Number(existing.deliveryFee || 0);
        const discount = Math.max(0, Number(discountAmount || 0));
        const adjusted = Math.max(0, subtotal - discount);

        const [updated] = await db
          .update(orders)
          .set({
            discountAmount: discount.toFixed(2),
            adjustedTotal: adjusted.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, id))
          .returning();

        res.json({ success: true, order: updated });
      } catch (err) {
        console.error("UPDATE BILLING ERROR:", err);
        res.status(500).json({ error: "Failed to update billing" });
      }
    }
  );
}
