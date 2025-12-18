import type { Express } from "express";

import { registerMedicineRoutes } from "./medicines";
import { registerCategoryRoutes } from "./categories";
import { registerOrderRoutes } from "./orders";

export function registerRoutes(app: Express) {
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
}

