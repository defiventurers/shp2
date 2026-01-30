import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,        // Render
    sameSite: "none",    // Vercel → Render
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function registerAuthRoutes(app: Express) {
  console.log("✅ AUTH ROUTES REGISTERED");

  /* HEALTH */
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* ---------------------------
     GOOGLE LOGIN (JWT FLOW)
  ---------------------------- */
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      console.log("🔥 /api/auth/google HIT");

      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ error: "Missing credential" });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
      setAuthCookie(res, token);

      res.json({ success: true, user });
    } catch (err) {
      console.error("❌ GOOGLE AUTH ERROR:", err);
      res.status(401).json({ error: "Google authentication failed" });
    }
  });

  /* CURRENT USER */
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const token = req.cookies?.auth_token;
    if (!token) return res.json(null);

    try {
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch {
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.json(null);
    }
  });

  /* LOGOUT */
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });
}