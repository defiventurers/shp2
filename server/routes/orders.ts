import type { Express, Response } from "express";
import { db } from "../db";
import { orders, orderItems, users } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq } from "drizzle-orm";

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* =========================
     CREATE ORDER (already fixed)
  ========================= */

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
              with: {
                items: true,
              },
              orderBy: (o, { desc }) => [desc(o.createdAt)],
            })
          : await db.query.orders.findMany({
              where: eq(orders.userId, req.user!.id),
              with: {
                items: true,
              },
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