import type { Express, Request, Response } from "express";

export function registerMedicineRoutes(app: Express) {
  /**
   * GET /api/medicines
   */
  app.get("/api/medicines", async (_req: Request, res: Response) => {
    try {
      // TODO: replace with Drizzle query later
      res.json({
        success: true,
        medicines: [],
      });
    } catch (error) {
      console.error("Error fetching medicines:", error);
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  });
}
