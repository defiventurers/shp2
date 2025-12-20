import type { Express, Request, Response } from "express";

console.log("🔥 ORDER ROUTES FILE LOADED 🔥");

export function registerOrderRoutes(app: Express) {
  console.log("🔥 ORDER ROUTES REGISTERED 🔥");

  /* -----------------------------
     CREATE ORDER
  ------------------------------ */
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const order = {
        id: crypto.randomUUID(),
        ...req.body,
        status: "PLACED",
        createdAt: new Date().toISOString(),
      };

      // TEMP: no DB yet — just echo back
      res.json({
        success: true,
        order,
      });
    } catch (err) {
      console.error("Create order error:", err);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  /* -----------------------------
     GET ALL ORDERS (ADMIN / USER)
  ------------------------------ */
  app.get("/api/orders", async (_req: Request, res: Response) => {
    res.json([]);
  });
}
