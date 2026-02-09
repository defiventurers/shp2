import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET missing");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,          // REQUIRED for https
    sameSite: "none",      // REQUIRED for cross-site
    path: "/",             // 🔑 IMPORTANT
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function registerAuthRoutes(app: Express) {
  console.log("✅ AUTH ROUTES REGISTERED");

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;
      if (!credential) return res.status(400).json({ error: "Missing credential" });

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload?.email) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, payload.email));

      if (!user) {
        [user] = await db
          .insert(users)
          .values({
            email: payload.email,
            firstName: payload.name ?? "",
          })
          .returning();
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.firstName },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      setAuthCookie(res, token);

      return res.json({ success: true });
    } catch (err) {
      console.error("AUTH ERROR:", err);
      return res.status(401).json({ error: "Authentication failed" });
    }
  });

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
        phone: user.phone,
      });
    } catch {
      res.clearCookie("auth_token", {
        path: "/",
        sameSite: "none",
        secure: true,
      });
      return res.json(null);
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token", {
      path: "/",
      sameSite: "none",
      secure: true,
    });
    res.json({ success: true });
  });
}