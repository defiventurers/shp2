import type { Express, Request, Response } from "express";
import { importBangaloreInventory } from "../scripts/importBangaloreInventory";

/**
 * ADMIN ROUTES
 * These routes are meant to be triggered MANUALLY (one-time)
 * from the browser — no CLI, no env vars.
 */
export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  /**
   * 🔥 ONE-TIME INVENTORY IMPORT
   *
   * Visit in browser:
   * https://your-backend-url/api/admin/import
   *
   * DO NOT refresh.
   * DO NOT call twice.
   */
  app.get("/api/admin/import", async (_req: Request, res: Response) => {
    try {
      console.log("🚨 ADMIN IMPORT TRIGGERED");

      // Start import (blocking)
      await importBangaloreInventory();

      console.log("✅ ADMIN IMPORT COMPLETED");

      res.json({
        success: true,
        message: "Bangalore inventory import completed successfully",
      });
    } catch (err) {
      console.error("❌ ADMIN IMPORT FAILED:", err);

      res.status(500).json({
        success: false,
        error: "Inventory import failed",
      });
    }
  });
}