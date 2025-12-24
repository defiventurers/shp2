import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function registerAuthRoutes(app: Express) {
  console.log("🔥 AUTH ROUTES REGISTERED 🔥");

  // Health
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // GOOGLE LOGIN (STUB FOR NOW)
  app.post("/api/auth/google", async (_req: Request, res: Response) => {
    const user = {
      id: "google-user",
      email: "user@gmail.com",
      name: "Google User",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user,
    });
  });

  // DEV LOGIN
  app.get("/api/auth/dev-login", (_req, res) => {
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

  // CURRENT USER
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const auth = req.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
      return res.json(null);
    }

    try {
      const token = auth.split(" ")[1];
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch {
      res.json(null);
    }
  });

  // LOGOUT (frontend clears token)
  app.post("/api/auth/logout", (_req, res) => {
    res.json({ success: true });
  });
}