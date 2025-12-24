import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function registerAuthRoutes(app: Express) {
  /* HEALTH */
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* DEV LOGIN */
  app.post("/api/auth/dev-login", (_req: Request, res: Response) => {
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

  /* CURRENT USER */
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.json(null);
    }

    try {
      const token = authHeader.replace("Bearer ", "");
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch {
      res.json(null);
    }
  });
}