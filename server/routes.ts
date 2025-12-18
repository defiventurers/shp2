import type { Express, Request, Response, NextFunction } from "express";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express) {
  // Setup auth (safe in all environments)
  setupAuth(app);

  // -------------------------
  // PUBLIC ROUTES (NO AUTH)
  // -------------------------

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // IMPORTANT:
  // Only enforce auth on Replit
  if (process.env.REPL_ID) {
    app.use("/api", isAuthenticated);
  }

  // -------------------------
  // API ROUTES (UNCHANGED)
  // -------------------------
  // medicines
  // categories
  // orders
  // uploads
  // etc.
  //
  // (your existing routes stay exactly where they are)

  return app;
}
