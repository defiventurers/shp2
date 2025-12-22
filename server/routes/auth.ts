import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

console.log("🔥 AUTH ROUTES FILE LOADED 🔥");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function getAuthDebug(req: Request) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return {
      hasCookie: false,
      token: null,
      user: null,
    };
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return {
      hasCookie: true,
      tokenPresent: true,
      user,
    };
  } catch (err) {
    return {
      hasCookie: true,
      tokenPresent: true,
      error: "JWT verification failed",
    };
  }
}

export function registerAuthRoutes(app: Express) {
  console.log("🔥 AUTH ROUTES REGISTERED 🔥");

  /* HEALTH */
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* 🔍 DEBUG AUTH — TEMPORARY */
  app.get("/api/debug/auth", (req: Request, res: Response) => {
    res.json(getAuthDebug(req));
  });

  /* GOOGLE LOGIN (STUB) */
  app.post("/api/auth/google", (_req, res) => {
    const user = {
      id: "google-user",
      email: "user@gmail.com",
      name: "Google User",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, user });
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

  /* CURRENT USER */
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const token = req.cookies?.auth_token;
    if (!token) return res.json(null);

    try {
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch {
      res.json(null);
    }
  });
}