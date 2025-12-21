import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

console.log("🔥 AUTH ROUTES FILE LOADED 🔥");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* -----------------------------
   Helpers
------------------------------ */
function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,      // REQUIRED (HTTPS only)
    sameSite: "none",  // REQUIRED for Vercel → Render
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/* -----------------------------
   Routes
------------------------------ */
export function registerAuthRoutes(app: Express) {
  console.log("🔥 AUTH ROUTES REGISTERED 🔥");

  /* Health */
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* Google login (STUB — replace later with real verification) */
  app.post("/api/auth/google", async (_req: Request, res: Response) => {
    const user = {
      id: "google-user",
      email: "user@gmail.com",
      name: "Google User",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);

    res.json({ success: true, user });
  });

  /* Dev login (for testing) */
  app.get("/api/auth/dev-login", (_req, res) => {
    const user = {
      id: "dev-user",
      email: "dev@example.com",
      name: "Dev User",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);

    res.json({ success: true, user });
  });

  /* Current user */
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.json(null);
    }

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

  /* Logout */
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });
}