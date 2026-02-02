import type { Express, Request, Response } from "express";
import { importBangaloreInventory } from "../scripts/importBangaloreInventory";

const ADMIN_KEY = process.env.ADMIN_IMPORT_KEY || "TEMP_IMPORT_KEY";

export function registerAdminImportRoutes(app: Express) {
  app.post("/api/admin/import-bangalore", async (req: Request, res: Response) => {
    const key = req.headers["x-admin-key"];

    if (key !== ADMIN_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      console.log("🚀 Admin-triggered Bangalore inventory import started");

      await importBangaloreInventory();

      console.log("✅ Bangalore inventory import finished");

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Import failed:", err);
      res.status(500).json({ error: "Import failed" });
    }
  });
}