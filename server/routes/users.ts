import type { Express, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { sql } from "drizzle-orm";

export function registerUserRoutes(app: Express) {
  console.log("👤 USER ROUTES REGISTERED");

  /* ---------------------------------
     UPSERT CURRENT USER PROFILE
     PATCH /api/users/me
  ---------------------------------- */
  app.patch(
    "/api/users/me",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const { name, phone, address } = req.body;

        if (!req.user?.email) {
          return res.status(400).json({ error: "Missing user email" });
        }

        const firstName = name ?? null;

        const [user] = await db.execute(sql`
          INSERT INTO users (email, first_name, phone, address)
          VALUES (${req.user.email}, ${firstName}, ${phone}, ${address})
          ON CONFLICT (email)
          DO UPDATE SET
            first_name = EXCLUDED.first_name,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            updated_at = NOW()
          RETURNING id, email, first_name, phone, address;
        `);

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.first_name,
            phone: user.phone,
            address: user.address,
          },
        });
      } catch (err) {
        console.error("❌ Profile upsert failed:", err);
        res.status(500).json({ error: "Failed to save profile" });
      }
    }
  );
}