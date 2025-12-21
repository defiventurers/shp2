import type { Express } from "express";

import { registerAuthRoutes } from "./routes/auth";
import { registerMedicineRoutes } from "./routes/medicines";
import { registerCategoryRoutes } from "./routes/categories";
import { registerOrderRoutes } from "./routes/orders";

console.log("🔥 ROUTES INDEX FILE LOADED 🔥");

export function registerRoutes(app: Express) {
  console.log("🔥 REGISTER ROUTES CALLED 🔥");

  // Auth (login, logout, me)
  registerAuthRoutes(app);

  // Public data
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);

  // Orders (AUTH REQUIRED)
  registerOrderRoutes(app);
}