import type { Express, Request, Response } from "express";
import { importBangaloreInventory } from "../scripts/importBangaloreInventory";

/**
 * Admin-only routes for one-time / controlled imports
 * NOTE: No auth for now (internal use only)
 */
export function registerAdminImportRoutes(app: Express) {
  console.log("🛠️ ADMIN IMPORT ROUTES REGISTERED");

  /**
   * POST /api/admin/import/bangalore
   * Imports Bangalore 45k inventory in SAFE batches
   */
  app.post(
    "/api/admin/import/bangalore",
    async (_req: Request, res: Response) => {
      try {
        console.log("🚀 Bangalore inventory import triggered via API");

        const result = await importBangaloreInventory();

        res.json({
          success: true,
          message: "Bangalore inventory import completed",
          ...result,
        });
      } catch (err) {
        console.error("❌ Bangalore import failed:", err);
        res.status(500).json({
          success: false,
          error: "Bangalore inventory import failed",
        });
      }
    }
  );
}