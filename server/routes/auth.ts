import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

console.log("🔥 AUTH ROUTES FILE LOADED 🔥");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const IS_PROD = process.env.NODE_ENV === "production";

/* -----------------------------
   Helpers
------------------------------ */
function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: IS_PROD,                 // ✅ only true in production
    sameSite: IS_PROD ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

  /* DEV LOGIN (browser-safe test login) */
  app.get("/api/auth/dev-login", (_req, res) => {
    const user = {
      id: "dev-user",
      email: "dev@example.com",
      name: "Dev User",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: "Logged in via dev-login",
      user,
    });
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
        secure: IS_PROD,
        sameSite: IS_PROD ? "none" : "lax",
      });
      res.json(null);
    }
  });

  /* Logout */
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? "none" : "lax",
    });
    res.json({ success: true });
  });
}
