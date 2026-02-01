import type { Express } from "express";

import { registerAuthRoutes } from "./auth";
import { registerUserRoutes } from "./users"; // ✅ THIS WAS MISSING EARLIER
import { registerMedicineRoutes } from "./medicines";
import { registerCategoryRoutes } from "./categories";
import { registerOrderRoutes } from "./orders";
import { registerPrescriptionRoutes } from "./prescriptions";

export function registerRoutes(app: Express) {
  console.log("📦 REGISTERING ROUTES");

  registerAuthRoutes(app);
  registerUserRoutes(app);          // 👤 USER ROUTES
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
  registerPrescriptionRoutes(app);
}