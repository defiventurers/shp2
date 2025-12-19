import type { Express } from "express";

console.log("✅ auth routes file loaded");

export function registerAuthRoutes(app: Express) {
  console.log("✅ registerAuthRoutes() called");

  app.get("/api/auth/health", (_req, res) => {
    res.json({ success: true });
  });
}
