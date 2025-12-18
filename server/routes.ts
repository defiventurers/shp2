import type { Express, Request, Response, NextFunction } from "express";

export async function registerRoutes(app: Express) {
  // Auth completely disabled outside Replit
  console.log("Auth disabled (non-Replit environment)");

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // No auth guard
  app.use("/api", (_req: Request, _res: Response, next: NextFunction) => next());

  // KEEP ALL YOUR EXISTING ROUTES BELOW THIS COMMENT
  // medicines
  // categories
  // orders
  // uploads
  // etc.

  return app;
}
