import type { Express, Request, Response } from "express";
import { importBangaloreInventory } from "../scripts/importBangaloreInventory";

/**
 * Admin-only routes
 * ⚠️ No auth for now (private URL)
 */
export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  /**
   * Trigger Bangalore inventory import manually
   *
   * POST /api/admin/import-bangalore
   */
  app.post(
    "/api/admin/import-bangalore",
    async (_req: Request, res: Response) => {
      try {
        console.log("🚀 Admin-triggered Bangalore inventory import started");

        await importBangaloreInventory();

        console.log("✅ Bangalore inventory import finished");

        res.json({
          success: true,
          message: "Bangalore inventory import completed",
        });
      } catch (err) {
        console.error("❌ Bangalore inventory import failed:", err);

        res.status(500).json({
          success: false,
          error: "Inventory import failed",
        });
      }
    }
  );
}
