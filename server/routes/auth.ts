import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,        // required on Render
    sameSite: "none",    // required for Vercel → Render
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function registerAuthRoutes(app: Express) {
  /* HEALTH */
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* DEV LOGIN (COOKIE-ONLY) */
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