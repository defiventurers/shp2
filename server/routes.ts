import type { Express } from "express";
import { registerAuthRoutes } from "./routes/auth";
import { registerMedicineRoutes } from "./routes/medicines";
import { registerCategoryRoutes } from "./routes/categories";
import { registerOrderRoutes } from "./routes/orders";

/**
 * Central route registry
 * ALL API routes MUST be registered here
 */
export function registerRoutes(app: Express) {
  registerAuthRoutes(app);
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
}
