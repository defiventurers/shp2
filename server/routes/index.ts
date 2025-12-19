import type { Express } from "express";
import { registerMedicineRoutes } from "./medicines";
import { registerCategoryRoutes } from "./categories";
import { registerOrderRoutes } from "./orders";

export function registerRoutes(app: Express) {
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "probe-ok" });
  });

  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
}
