import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function registerAuthRoutes(app: Express) {
  console.log("🔥 AUTH ROUTES REGISTERED (JWT HEADER MODE) 🔥");

  /* Health */
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* Google login (stub for now) */
  app.post("/api/auth/google", async (_req: Request, res: Response) => {
    const user = {
      id: "google-user",
      email: "user@gmail.com",
      name: "Google User",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

    // 🔥 TOKEN RETURNED IN JSON (NOT COOKIE)
    res.json({
      success: true,
      token,
      user,
    });
  });

  /* Dev login */
  app.post("/api/auth/dev-login", (_req, res) => {
    const user = {
      id: "dev-user",
      email: "dev@example.com",
      name: "Dev User",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user,
    });
  });

  /* Current user (HEADER AUTH) */
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const auth = req.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
      return res.json(null);
    }

    try {
      const token = auth.replace("Bearer ", "");
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch {
      res.json(null);
    }
  });
}