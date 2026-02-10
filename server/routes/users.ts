import type { Express, Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";
import { eq } from "drizzle-orm";

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
        const { name, phone } = req.body;

        if (!req.user?.id) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        // ✅ Enforce real Indian mobile number
        if (!/^[6-9]\d{9}$/.test(phone)) {
          return res.status(400).json({
            error: "Invalid phone number",
          });
        }

        await db
          .update(users)
          .set({
            firstName: name ?? null,
            phone,
            updatedAt: new Date(),
          })
          .where(eq(users.id, req.user.id));

        const updatedUser = await db.query.users.findFirst({
          where: eq(users.id, req.user.id),
        });

        res.json({
          success: true,
          user: {
            id: updatedUser?.id,
            email: updatedUser?.email,
            name: updatedUser?.firstName,
            phone: updatedUser?.phone,
          },
        });
      } catch (err) {
        console.error("❌ Profile update failed:", err);
        res.status(500).json({ error: "Failed to save profile" });
      }
    }
  );
}