import type { Express } from "express";
import { importBangaloreInventory } from "../scripts/importBangaloreInventory";

export function registerAdminImportRoutes(app: Express) {
  app.post("/api/admin/import/bangalore", async (_req, res) => {
    try {
      await importBangaloreInventory();

      res.json({
        success: true,
        message: "Bangalore inventory batch imported",
      });
    } catch (err: any) {
      console.error("❌ Import failed:", err);

      res.status(500).json({
        success: false,
        error: err.message ?? "Import failed",
      });
    }
  });
}