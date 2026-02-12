import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { desc, eq } from "drizzle-orm";
import multer from "multer";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const upload = multer({ storage: multer.memoryStorage() });
const TAX_RATE_PERCENT = 12;
const ORDER_META_PREFIX = "ORDER_META_JSON::";

type RequestedItem = {
  id: string;
  name: string;
  quantity: number;
  customerNotes?: string;
  status?: "pending" | "available" | "not_available";
  pharmacistPricePerUnit?: number | null;
  pharmacistNote?: string;
};

type OrderMeta = {
  requestedItems: RequestedItem[];
  plainNotes?: string;
};

async function sendWhatsAppText(text: string) {
  const webhook = process.env.WHATSAPP_WEBHOOK_URL;
  if (!webhook) {
    console.log("ℹ️ WHATSAPP_WEBHOOK_URL not configured. Message:", text);
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

function toMoney(value: number): string {
  return Math.max(0, value).toFixed(2);
}

function computeSave10Discount(totalInclusive: number): {
  preTaxSubtotal: number;
  taxAmount: number;
  discountAmount: number;
  adjustedTotal: number;
} {
  const preTaxSubtotal = totalInclusive / (1 + TAX_RATE_PERCENT / 100);
  const taxAmount = totalInclusive - preTaxSubtotal;
  const discountAmount = preTaxSubtotal * 0.1;
  const adjustedTotal = Math.max(0, totalInclusive - discountAmount);

  return {
    preTaxSubtotal,
    taxAmount,
    discountAmount,
    adjustedTotal,
  };
}

function parseOrderMeta(notesValue: string | null | undefined): OrderMeta {
  const raw = String(notesValue || "").trim();

  if (!raw) {
    return { requestedItems: [] };
  }

  if (!raw.startsWith(ORDER_META_PREFIX)) {
    return {
      requestedItems: [],
      plainNotes: raw,
    };
  }

  try {
    const parsed = JSON.parse(raw.slice(ORDER_META_PREFIX.length));
    return {
      requestedItems: Array.isArray(parsed?.requestedItems) ? parsed.requestedItems : [],
      plainNotes: typeof parsed?.plainNotes === "string" ? parsed.plainNotes : undefined,
    };
  } catch {
    return { requestedItems: [] };
  }
}

function buildOrderMetaNotes(requestedItems: RequestedItem[], plainNotes?: string): string | null {
  const cleanItems = requestedItems
    .filter((item) => item?.name)
    .map((item) => ({
      id: item.id || crypto.randomUUID(),
      name: String(item.name || "").trim(),
      quantity: Math.max(1, Number(item.quantity || 1)),
      customerNotes: String(item.customerNotes || "").trim(),
      status: item.status || "pending",
      pharmacistPricePerUnit:
        item.pharmacistPricePerUnit == null
          ? null
          : Math.max(0, Number(item.pharmacistPricePerUnit || 0)),
      pharmacistNote: String(item.pharmacistNote || "").trim(),
    }))
    .filter((item) => item.name);

  const payload = {
    requestedItems: cleanItems,
    plainNotes: plainNotes?.trim() || undefined,
  };

  if (!cleanItems.length && !payload.plainNotes) {
    return null;
  }

  return `${ORDER_META_PREFIX}${JSON.stringify(payload)}`;
}

function getRequestedItemsSubtotal(requestedItems: RequestedItem[]): number {
  return requestedItems.reduce((sum, item) => {
    if (item.status !== "available") return sum;
    const unitPrice = Number(item.pharmacistPricePerUnit || 0);
    const qty = Math.max(1, Number(item.quantity || 1));
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return sum;
    return sum + unitPrice * qty;
  }, 0);
}

async function recalcOrderTotals(orderId: string) {
  const existing = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!existing) return null;

  const meta = parseOrderMeta(existing.notes);
  const requestedSubtotal = getRequestedItemsSubtotal(meta.requestedItems);

  const subtotal = existing.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const deliveryFee = Number(existing.deliveryFee || 0);
  const total = subtotal + deliveryFee;

  const promoCode = (existing.promoCode || "").toUpperCase();
  const hasSave10 = promoCode === "SAVE10";

  let discountAmount = Number(existing.discountAmount || 0);
  let preTaxSubtotal = Number(existing.preTaxSubtotal || subtotal);
  let taxAmount = Number(existing.taxAmount || 0);
  let adjustedTotal = Number(existing.adjustedTotal || total);

  if (hasSave10) {
    const calc = computeSave10Discount(total);
    discountAmount = calc.discountAmount;
    preTaxSubtotal = calc.preTaxSubtotal;
    taxAmount = calc.taxAmount;
    adjustedTotal = calc.adjustedTotal + requestedSubtotal;
  } else {
    adjustedTotal = Math.max(0, total - discountAmount) + requestedSubtotal;
    preTaxSubtotal = subtotal;
    taxAmount = 0;
  }

  const [updated] = await db
    .update(orders)
    .set({
      subtotal: toMoney(subtotal),
      total: toMoney(total),
      discountAmount: toMoney(discountAmount),
      adjustedTotal: toMoney(adjustedTotal),
      preTaxSubtotal: toMoney(preTaxSubtotal),
      taxAmount: toMoney(taxAmount),
      taxRate: TAX_RATE_PERCENT.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  return updated;
}

function withRequestedItems<T extends { notes?: string | null }>(rows: T[]) {
  return rows.map((row) => {
    const meta = parseOrderMeta(row.notes);
    return {
      ...row,
      requestedItems: meta.requestedItems,
      customerOrderNotes: meta.plainNotes || null,
    };
  });
}

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  app.post("/api/orders", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const {
        items,
        requestedItems,
        subtotal,
        deliveryFee,
        total,
        deliveryType,
        deliveryAddress,
        customerName,
        customerPhone,
        customerEmail,
        prescriptionId,
        promoCode,
      } = req.body;

      const requestedItemsInput = Array.isArray(requestedItems) ? requestedItems : [];

      if (!customerName || !customerPhone) {
        return res.status(400).json({
          error: "Name and phone number are required to place an order",
        });
      }

      if ((!items || items.length === 0) && requestedItemsInput.length === 0) {
        return res.status(400).json({
          error: "Order must contain at least one item",
        });
      }

      const normalizedRequestedItems: RequestedItem[] = requestedItemsInput
        .map((item: any) => ({
          id: String(item?.id || crypto.randomUUID()),
          name: String(item?.name || "").trim(),
          quantity: Math.max(1, Number(item?.quantity || 1)),
          customerNotes: String(item?.customerNotes || "").trim(),
          status: "pending" as const,
          pharmacistPricePerUnit: null,
          pharmacistNote: "",
        }))
        .filter((item) => item.name);

      const orderNumber = `ORD-${Date.now()}`;
      const normalizedPromo = String(promoCode || "")
        .trim()
        .toUpperCase();
      const hasSave10 = normalizedPromo === "SAVE10";

      const totalNum = Number(total || 0);
      const subtotalNum = Number(subtotal || 0);
      const deliveryNum = Number(deliveryFee || 0);

      const discountCalc = hasSave10
        ? computeSave10Discount(totalNum)
        : {
            preTaxSubtotal: subtotalNum,
            taxAmount: 0,
            discountAmount: 0,
            adjustedTotal: totalNum,
          };

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
          subtotal: toMoney(subtotalNum),
          deliveryFee: toMoney(deliveryNum),
          total: toMoney(totalNum),
          preTaxSubtotal: toMoney(discountCalc.preTaxSubtotal),
          taxAmount: toMoney(discountCalc.taxAmount),
          taxRate: TAX_RATE_PERCENT.toFixed(2),
          promoCode: hasSave10 ? "SAVE10" : null,
          adjustedTotal: toMoney(discountCalc.adjustedTotal),
          discountAmount: toMoney(discountCalc.discountAmount),
          prescriptionId: prescriptionId || null,
          notes: buildOrderMetaNotes(normalizedRequestedItems),
        })
        .returning();

      for (const item of items || []) {
        const itemPrice = Number(item.price || 0);
        const itemQty = Number(item.quantity || 0);

        await db.insert(orderItems).values({
          orderId: order.id,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: itemQty,
          price: toMoney(itemPrice),
          total: toMoney(itemPrice * itemQty),
        });
      }

      const orderItemsSummary = (items || [])
        .slice(0, 6)
        .map((i: any) => `• ${i.medicineName} x${i.quantity}`)
        .join("\n");

      const requestedItemsSummary = normalizedRequestedItems
        .slice(0, 6)
        .map((i) => `• ${i.name} x${i.quantity} (price to be confirmed)`)
        .join("\n");

      void sendWhatsAppText(
        [
          `🧾 New order placed: ${order.orderNumber}`,
          `Customer: ${customerName} (${customerPhone})`,
          `Delivery: ${deliveryType}${deliveryAddress ? ` - ${deliveryAddress}` : ""}`,
          `Payable: ₹${toMoney(discountCalc.adjustedTotal)}`,
          `Items:\n${orderItemsSummary || "None"}`,
          `Requested:\n${requestedItemsSummary || "None"}`,
        ].join("\n"),
      );

      res.json({
        success: true,
        orderNumber: order.orderNumber,
        status: order.status,
        promoCode: order.promoCode,
        discountAmount: order.discountAmount,
        adjustedTotal: order.adjustedTotal,
      });
    } catch (err) {
      console.error("❌ CREATE ORDER ERROR:", err);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const isStaff = req.headers["x-staff-auth"] === "true";

      const data = isStaff
        ? await db.query.orders.findMany({
            with: {
              items: true,
              prescription: {
                columns: {
                  id: true,
                  name: true,
                  imageUrls: true,
                },
              },
            },
            orderBy: (o, { desc }) => [desc(o.createdAt)],
          })
        : await db.query.orders.findMany({
            where: eq(orders.userId, req.user!.id),
            with: {
              items: true,
              prescription: {
                columns: {
                  id: true,
                  name: true,
                  imageUrls: true,
                },
              },
            },
            orderBy: (o, { desc }) => [desc(o.createdAt)],
          });

      res.json({ success: true, orders: withRequestedItems(data as any) });
    } catch (err) {
      console.error("FETCH ORDERS ERROR:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/orders/:id/status", requireAuth, async (req: AuthRequest, res: Response) => {
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

      void sendWhatsAppText(
        `📦 Order ${updated.orderNumber} status updated to ${status}. Customer: ${updated.customerName} (${updated.customerPhone})`,
      );

      res.json({ success: true, order: updated });
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.patch("/api/orders/:id/billing", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const isStaff = req.headers["x-staff-auth"] === "true";
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const { id } = req.params;
      const { discountAmount, adjustedTotal } = req.body;

      const existing = await db.query.orders.findFirst({ where: eq(orders.id, id) });
      if (!existing) return res.status(404).json({ error: "Order not found" });

      const totalNum = Number(existing.total || 0);
      const discount = Math.max(0, Number(discountAmount || 0));
      const adjusted = adjustedTotal == null ? Math.max(0, totalNum - discount) : Math.max(0, Number(adjustedTotal));

      const [updated] = await db
        .update(orders)
        .set({
          promoCode: null,
          discountAmount: toMoney(discount),
          adjustedTotal: toMoney(adjusted),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      res.json({ success: true, order: updated });
    } catch (err) {
      console.error("UPDATE BILLING ERROR:", err);
      res.status(500).json({ error: "Failed to update billing" });
    }
  });

  app.patch("/api/orders/:id/line-items", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const isStaff = req.headers["x-staff-auth"] === "true";
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const { id } = req.params;
      const updates = Array.isArray(req.body?.items) ? req.body.items : [];
      if (!updates.length) return res.status(400).json({ error: "No line item updates provided" });

      for (const item of updates) {
        const qty = Math.max(1, Number(item.quantity || 1));
        const price = Math.max(0, Number(item.price || 0));
        const total = qty * price;

        await db
          .update(orderItems)
          .set({
            quantity: qty,
            price: toMoney(price),
            total: toMoney(total),
          })
          .where(eq(orderItems.id, item.id));
      }

      const recalculated = await recalcOrderTotals(id);
      if (!recalculated) return res.status(404).json({ error: "Order not found" });

      res.json({ success: true, order: recalculated });
    } catch (err) {
      console.error("UPDATE LINE ITEMS ERROR:", err);
      res.status(500).json({ error: "Failed to update line items" });
    }
  });

  app.patch("/api/orders/:id/requested-items", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const isStaff = req.headers["x-staff-auth"] === "true";
      if (!isStaff) return res.status(403).json({ error: "Forbidden" });

      const { id } = req.params;
      const updates = Array.isArray(req.body?.requestedItems) ? req.body.requestedItems : [];
      if (!updates.length) return res.status(400).json({ error: "No requested items provided" });

      const existing = await db.query.orders.findFirst({ where: eq(orders.id, id) });
      if (!existing) return res.status(404).json({ error: "Order not found" });

      const existingMeta = parseOrderMeta(existing.notes);
      const existingRequestedItems = existingMeta.requestedItems;
      const oldRequestedSubtotal = getRequestedItemsSubtotal(existingRequestedItems);

      const byId = new Map(existingRequestedItems.map((item) => [item.id, item]));
      const mergedRequestedItems = existingRequestedItems.map((item) => {
        const patch = updates.find((x: any) => String(x.id) === item.id);
        if (!patch) return item;

        const nextStatus = patch.status === "available" || patch.status === "not_available" || patch.status === "pending"
          ? patch.status
          : item.status || "pending";

        const nextPrice =
          patch.pharmacistPricePerUnit == null
            ? item.pharmacistPricePerUnit ?? null
            : Math.max(0, Number(patch.pharmacistPricePerUnit || 0));

        return {
          ...item,
          status: nextStatus,
          pharmacistPricePerUnit: nextStatus === "available" ? nextPrice : null,
          pharmacistNote:
            patch.pharmacistNote == null
              ? String(item.pharmacistNote || "")
              : String(patch.pharmacistNote || "").trim(),
        };
      });

      for (const patch of updates) {
        const patchId = String(patch.id || "");
        if (!patchId || byId.has(patchId)) continue;
      }

      const newRequestedSubtotal = getRequestedItemsSubtotal(mergedRequestedItems);
      const currentAdjusted = Number(existing.adjustedTotal || existing.total || 0);
      const nextAdjusted = Math.max(0, currentAdjusted - oldRequestedSubtotal + newRequestedSubtotal);

      const [updated] = await db
        .update(orders)
        .set({
          notes: buildOrderMetaNotes(mergedRequestedItems, existingMeta.plainNotes),
          adjustedTotal: toMoney(nextAdjusted),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      res.json({
        success: true,
        order: {
          ...updated,
          requestedItems: mergedRequestedItems,
        },
      });
    } catch (err) {
      console.error("UPDATE REQUESTED ITEMS ERROR:", err);
      res.status(500).json({ error: "Failed to update requested items" });
    }
  });

  app.post(
    "/api/orders/:id/bill-image",
    requireAuth,
    upload.single("billImage"),
    async (req: AuthRequest, res: Response) => {
      try {
        const isStaff = req.headers["x-staff-auth"] === "true";
        if (!isStaff) return res.status(403).json({ error: "Forbidden" });

        if (!req.file) return res.status(400).json({ error: "Bill image is required" });

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.v2.uploader
            .upload_stream({ folder: "order_bills" }, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            })
            .end(req.file!.buffer);
        });

        const [updated] = await db
          .update(orders)
          .set({ billImageUrl: uploadResult.secure_url, updatedAt: new Date() })
          .where(eq(orders.id, req.params.id))
          .returning();

        if (!updated) return res.status(404).json({ error: "Order not found" });

        res.json({ success: true, order: updated, billImageUrl: uploadResult.secure_url });
      } catch (err) {
        console.error("UPLOAD BILL IMAGE ERROR:", err);
        res.status(500).json({ error: "Failed to upload bill image" });
      }
    },
  );
}
