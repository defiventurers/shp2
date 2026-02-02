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

/* =========================
   Allowed Status Flow
========================= */
const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "delivered",
];

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* =========================
     CREATE ORDER (CUSTOMER)
  ========================= */
  app.post(
    "/api/orders",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = req.user;
        if (!user?.id) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        /* -------------------------
           Ensure user exists
        -------------------------- */
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        if (!existingUser) {
          await db.insert(users).values({
            id: user.id,
            email: user.email ?? "unknown@example.com",
            firstName: user.name?.split(" ")[0] ?? "Customer",
            lastName: user.name?.split(" ")[1] ?? "",
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

        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: "Order items required" });
        }

        /* -------------------------
           VALIDATE MEDICINES
        -------------------------- */
        const medicineIds = items.map((i: any) => i.medicineId);

        const validMedicines = await db
          .select({ id: medicines.id })
          .from(medicines)
          .where(inArray(medicines.id, medicineIds));

        const validIds = new Set(validMedicines.map(m => m.id));

        const invalid = medicineIds.filter(id => !validIds.has(id));

        if (invalid.length > 0) {
          return res.status(400).json({
            error: "Invalid medicine selected",
            invalidMedicineIds: invalid,
          });
        }

        /* -------------------------
           CREATE ORDER
        -------------------------- */
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

        /* -------------------------
           INSERT ORDER ITEMS
        -------------------------- */
        await db.insert(orderItems).values(
          items.map((item: any) => ({
            orderId: order.id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
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

  /* =========================
     GET ORDERS
  ========================= */
  app.get(
    "/api/orders",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const isStaff = req.headers["x-staff-auth"] === "true";

        const result = isStaff
          ? await db.query.orders.findMany({
              with: { items: true },
              orderBy: (o, { desc }) => [desc(o.createdAt)],
            })
          : await db.query.orders.findMany({
              where: eq(orders.userId, req.user!.id),
              with: { items: true },
              orderBy: (o, { desc }) => [desc(o.createdAt)],
            });

        res.json(result);
      } catch (err) {
        console.error("FETCH ORDERS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    }
  );

  /* =========================
     UPDATE ORDER STATUS (STAFF)
  ========================= */
  app.patch(
    "/api/orders/:id/status",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const isStaff = req.headers["x-staff-auth"] === "true";
        if (!isStaff) {
          return res.status(403).json({ error: "Forbidden" });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!ALLOWED_STATUSES.includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }

        const [updated] = await db
          .update(orders)
          .set({ status })
          .where(eq(orders.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: "Order not found" });
        }

        res.json({ success: true, order: updated });
      } catch (err) {
        console.error("STATUS UPDATE ERROR:", err);
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  );
}