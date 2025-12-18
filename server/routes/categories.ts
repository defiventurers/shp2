import type { Express, Request, Response } from "express";

export function registerCategoryRoutes(app: Express) {
  /**
   * GET /api/categories
   */
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      // TODO: replace with Drizzle query later
      res.json({
        success: true,
        categories: [],
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
}

