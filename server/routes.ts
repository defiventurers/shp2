import type { Express } from "express";

import { registerMedicineRoutes } from "./routes/medicines";
import { registerCategoryRoutes } from "./routes/categories";
import { registerOrderRoutes } from "./routes/orders";

export function registerRoutes(app: Express) {
  // ✅ Health check (mandatory)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ✅ API routes
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);

  return app;
}
