import type { Express, Request, Response } from "express";

export function registerOrderRoutes(app: Express) {
  /**
   * GET /api/orders
   */
  app.get("/api/orders", async (_req: Request, res: Response) => {
    try {
      // TODO: replace with Drizzle query later
      res.json({
        success: true,
        orders: [],
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
}
