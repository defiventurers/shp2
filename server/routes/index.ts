import type { Express } from "express";

import { registerAuthRoutes } from "./auth";
import { registerUserRoutes } from "./users"; // ✅ REQUIRED
import { registerMedicineRoutes } from "./medicines";
import { registerCategoryRoutes } from "./categories";
import { registerOrderRoutes } from "./orders";
import { registerPrescriptionRoutes } from "./prescriptions";

export function registerRoutes(app: Express) {
  registerAuthRoutes(app);
  registerUserRoutes(app);        // ✅ THIS FIXES PROFILE SAVE
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
  registerPrescriptionRoutes(app);
}