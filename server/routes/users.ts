import type { Express, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq } from "drizzle-orm";

export function registerUserRoutes(app: Express) {
  console.log("👤 USER ROUTES REGISTERED");

  /* ---------------------------------
     UPDATE CURRENT USER
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

        const [updated] = await db
          .update(users)
          .set({
            firstName: name ?? undefined,
            phone: phone ?? undefined,
            address: address ?? undefined,
            updatedAt: new Date(),
          })
          .where(eq(users.email, req.user.email))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          success: true,
          user: {
            id: updated.id,
            name: updated.firstName,
            phone: updated.phone,
            address: updated.address,
            email: updated.email,
          },
        });
      } catch (err) {
        console.error("❌ Update user failed:", err);
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  );
}