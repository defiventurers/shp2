import type { Express, Request, Response } from "express";
import { importBangaloreInventory } from "../scripts/importBangaloreInventory";

let isRunning = false;

export function registerAdminImportRoutes(app: Express) {
  app.post("/api/admin/import/bangalore", async (_req: Request, res: Response) => {
    if (isRunning) {
      return res.status(409).json({
        success: false,
        message: "Import already running",
      });
    }

    isRunning = true;

    try {
      const result = await importBangaloreInventory();
      res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.error("❌ Import failed:", err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    } finally {
      isRunning = false;
    }
  });
}