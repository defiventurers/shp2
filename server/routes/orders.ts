import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems, users, medicines } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq, inArray } from "drizzle-orm";

/* =========================
   Order Number Generator
========================= */
function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SHP-${date}-${rand}`;
}

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  app.post(
    "/api/orders",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = req.user!;
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

        if (!items?.length) {
          return res.status(400).json({ error: "Order items required" });
        }

        /* Ensure user exists */
        const existing = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        if (!existing) {
          await db.insert(users).values({
            id: user.id,
            email: user.email ?? "unknown@example.com",
            firstName: customerName.split(" ")[0],
            lastName: customerName.split(" ").slice(1).join(" "),
          });
        }

        /* Validate medicines */
        const medicineIds = items.map((i: any) => i.medicineId);
        const valid = await db
          .select({ id: medicines.id })
          .from(medicines)
          .where(inArray(medicines.id, medicineIds));

        if (valid.length !== medicineIds.length) {
          return res.status(400).json({ error: "Invalid medicine in order" });
        }

        /* Create order */
        const [order] = await db
          .insert(orders)
          .values({
            orderNumber: generateOrderNumber(),
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

        /* Insert items */
        await db.insert(orderItems).values(
          items.map((i: any) => ({
            orderId: order.id,
            medicineId: i.medicineId,
            medicineName: i.medicineName,
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity,
          }))
        );

        res.json({
          success: true,
          orderNumber: order.orderNumber,
        });
      } catch (err) {
        console.error("ORDER ERROR:", err);
        res.status(500).json({ error: "Failed to place order" });
      }
    }
  );
}