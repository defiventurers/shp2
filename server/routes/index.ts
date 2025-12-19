import type { Express } from "express";

/**
 * ⚠️ IMPORTANT:
 * These imports MUST stay at top-level
 * so esbuild includes them in production
 */
import "./auth";
import { registerAuthRoutes } from "./auth";
import { registerMedicineRoutes } from "./medicines";
import { registerCategoryRoutes } from "./categories";
import { registerOrderRoutes } from "./orders";

export function registerRoutes(app: Express) {
  registerAuthRoutes(app);
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
}
