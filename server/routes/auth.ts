import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

console.log("🔥 AUTH ROUTES FILE LOADED 🔥");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export function registerAuthRoutes(app: Express) {
  console.log("🔥 AUTH ROUTES REGISTERED 🔥");

  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/auth/me", (_req, res) => {
    res.json(null);
  });
}
