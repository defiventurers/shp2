import type { Express, Request, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";

export function registerUserRoutes(app: Express) {
  console.log("👤 USER ROUTES REGISTERED");

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

        const [updated] = await db
          .update(users)
          .set({
            firstName: name ?? null,
            phone: phone ?? null,
            address: address ?? null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, req.user!.id))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          success: true,
          user: {
            id: updated.id,
            name: updated.firstName,
            email: updated.email,
            phone: updated.phone,
            address: updated.address,
          },
        });
      } catch (err) {
        console.error("❌ Profile update failed:", err);
        res.status(500).json({ error: "Could not update profile" });
      }
    }
  );
}