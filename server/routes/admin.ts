import type { Express, Request, Response } from "express";
import { importBangaloreInventory } from "../scripts/importBangaloreInventory";

export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  app.post("/api/admin/import-bangalore", async (_req: Request, res: Response) => {
    try {
      console.log("🚀 Admin import started");

      await importBangaloreInventory();

      console.log("✅ Admin import completed");
      res.json({ success: true });
    } catch (err) {
      console.error("❌ Admin import failed", err);
      res.status(500).json({ success: false });
    }
  });
}