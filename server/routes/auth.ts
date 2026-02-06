import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function registerAuthRoutes(app: Express) {
  console.log("✅ AUTH ROUTES REGISTERED");

  /* =========================
     GOOGLE LOGIN
  ========================= */
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ error: "Missing Google credential" });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload?.email) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      /* ---------------- UPSERT USER ---------------- */
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, payload.email));

      let user;

      if (!existing) {
        const [created] = await db
          .insert(users)
          .values({
            email: payload.email,
            firstName: payload.given_name ?? payload.name ?? "",
            lastName: payload.family_name ?? "",
          })
          .returning();

        user = created;
      } else {
        user = existing;
      }

      /* ---------------- ISSUE JWT ---------------- */
      const jwtPayload = {
        id: user.id,
        email: user.email,
        name: user.firstName,
      };

      const token = jwt.sign(jwtPayload, JWT_SECRET, {
        expiresIn: "7d",
      });

      setAuthCookie(res, token);

      return res.json({
        success: true,
        user: jwtPayload,
      });
    } catch (err) {
      console.error("❌ GOOGLE AUTH ERROR:", err);
      return res.status(401).json({ error: "Google authentication failed" });
    }
  });

  /* =========================
     CURRENT USER
  ========================= */
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const token = req.cookies?.auth_token;
    if (!token) return res.json(null);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.id));

      if (!user) return res.json(null);

      return res.json({
        id: user.id,
        email: user.email,
        name: user.firstName,
        phone: user.phone ?? null,
      });
    } catch {
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      return res.json(null);
    }
  });

  /* =========================
     LOGOUT
  ========================= */
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });
}