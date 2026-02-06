import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems, users, medicines } from "@shared/schema";
import { AuthRequest } from "../middleware/requireAuth";
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

  /* =========================
     CREATE ORDER (GUEST + USER)
  ========================= */
  app.post("/api/orders", async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user ?? null;

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
        notes,
      } = req.body;

      /* -------------------------
         BASIC VALIDATION
      -------------------------- */
      if (!customerName || !customerPhone) {
        return res.status(400).json({ error: "Customer details required" });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order items required" });
      }

      /* -------------------------
         VALIDATE MEDICINES
      -------------------------- */
      const medicineIds = items.map((i: any) => i.medicineId);

      const validMedicines = await db
        .select({
          id: medicines.id,
          requiresPrescription: medicines.requiresPrescription,
        })
        .from(medicines)
        .where(inArray(medicines.id, medicineIds));

      if (validMedicines.length !== medicineIds.length) {
        return res.status(400).json({ error: "Invalid medicine selected" });
      }

      /* -------------------------
         RX VALIDATION
      -------------------------- */
      const rxRequired = validMedicines.some(
        (m) => m.requiresPrescription === true
      );

      if (rxRequired && !prescriptionId) {
        return res.status(400).json({
          error: "Prescription required for one or more items",
        });
      }

      /* -------------------------
         CREATE USER IF LOGGED IN
      -------------------------- */
      let userId: string | null = null;

      if (user?.id) {
        userId = user.id;

        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        if (!existingUser) {
          await db.insert(users).values({
            id: user.id,
            email: user.email ?? customerEmail ?? "guest@example.com",
            firstName: customerName.split(" ")[0],
            lastName: customerName.split(" ").slice(1).join(" "),
          });
        }
      }

      /* -------------------------
         CREATE ORDER
         ⚠️ IMPORTANT FIX HERE
      -------------------------- */
      const [order] = await db
        .insert(orders)
        .values({
          order_number: generateOrderNumber(), // ✅ FIXED
          userId,
          customerName,
          customerPhone,
          customerEmail,
          deliveryType,
          deliveryAddress,
          subtotal,
          deliveryFee,
          total,
          status: "pending",
          prescriptionId: prescriptionId ?? null,
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
          price: Number(item.price),
          total: Number(item.price) * item.quantity,
        }))
      );

      res.json({
        success: true,
        orderNumber: order.order_number,
      });
    } catch (err) {
      console.error("ORDER ERROR:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });
}