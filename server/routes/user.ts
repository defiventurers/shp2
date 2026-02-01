import type { Express, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";

export function registerUserRoutes(app: Express) {
  console.log("✅ USER ROUTES REGISTERED");

  /* ---------------------------------
     UPDATE CURRENT USER PROFILE
     PATCH /api/users/me
  ---------------------------------- */
  app.patch(
    "/api/users/me",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const { name, phone, address } = req.body;

        const updates: any = {};

        if (name) {
          const parts = name.trim().split(" ");
          updates.firstName = parts[0];
          updates.lastName = parts.slice(1).join(" ") || null;
        }

        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: "No fields to update" });
        }

        const [updated] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, req.user!.id))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({ success: true });
      } catch (err) {
        console.error("❌ Update profile failed:", err);
        res.status(500).json({ error: "Update failed" });
      }
    }
  );
}