import type { Express } from "express";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express) {
  // Auth is now safe in all environments
  setupAuth(app);

  // -------------------------
  // PUBLIC / API ROUTES
  // -------------------------

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Example protected route pattern (kept for parity)
  app.use("/api", isAuthenticated);

  // ⬇⬇⬇ KEEP ALL YOUR EXISTING ROUTES BELOW ⬇⬇⬇
  // medicines
  // categories
  // orders
  // uploads
  // etc.

  return app;
}
