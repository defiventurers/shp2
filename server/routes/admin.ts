import type { Express, Request, Response } from "express";
import { importBangaloreInventory } from "../scripts/importBangaloreInventory";

export function registerAdminRoutes(app: Express) {
  console.log("🛠️ ADMIN ROUTES REGISTERED");

  app.post(
    "/api/admin/import-inventory",
    async (_req: Request, res: Response) => {
      try {
        console.log("⚙️ Admin triggered inventory import");
        await importBangaloreInventory();
        res.json({ success: true });
      } catch (err) {
        console.error("❌ IMPORT FAILED:", err);
        res.status(500).json({ success: false });
      }
    }
  );
}