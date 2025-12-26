import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* -----------------------------
   Google OAuth Client
------------------------------ */
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

/* -----------------------------
   Helper: set auth cookie
------------------------------ */
function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,        // required on Render
    sameSite: "none",    // required for Vercel → Render
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function registerAuthRoutes(app: Express) {

  /* -----------------------------
     HEALTH
  ------------------------------ */
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* -----------------------------
     DEV LOGIN (COOKIE-ONLY)
  ------------------------------ */
  app.post("/api/auth/dev-login", (_req: Request, res: Response) => {
    const user = {
      id: "dev-user",
      email: "dev@example.com",
      name: "Dev User",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);

    res.json({ success: true, user });
  });

  /* -----------------------------
     GOOGLE LOGIN (START)
  ------------------------------ */
  app.get("/api/auth/google", (_req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "Google OAuth not configured" });
    }

    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
      redirect_uri: `${process.env.API_BASE_URL}/api/auth/google/callback`,
    });

    res.redirect(url);
  });

  /* -----------------------------
     GOOGLE CALLBACK
  ------------------------------ */
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        return res.redirect(process.env.FRONTEND_URL || "/");
      }

      const { tokens } = await googleClient.getToken({
        code,
        redirect_uri: `${process.env.API_BASE_URL}/api/auth/google/callback`,
      });

      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("Invalid Google token");

      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
      setAuthCookie(res, token);

      res.redirect(process.env.FRONTEND_URL || "/");
    } catch (err) {
      console.error("GOOGLE AUTH ERROR:", err);
      res.redirect(process.env.FRONTEND_URL || "/");
    }
  });

  /* -----------------------------
     CURRENT USER
  ------------------------------ */
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

  /* -----------------------------
     LOGOUT
  ------------------------------ */
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });
}