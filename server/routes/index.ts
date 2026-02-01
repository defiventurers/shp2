import type { Express } from "express";

import { registerAuthRoutes } from "./auth";
import { registerUserRoutes } from "./users"; // ✅ ADD THIS
import { registerMedicineRoutes } from "./medicines";
import { registerCategoryRoutes } from "./categories";
import { registerOrderRoutes } from "./orders";
import { registerPrescriptionRoutes } from "./prescriptions";

export function registerRoutes(app: Express) {
  // 🔐 Auth & user profile
  registerAuthRoutes(app);
  registerUserRoutes(app); // ✅ PROFILE UPDATE ROUTE

  // 📦 Core features
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
  registerPrescriptionRoutes(app);
}