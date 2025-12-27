import type { Express, Request, Response, NextFunction } from "express";

/**
 * Auth is disabled outside Replit.
 * This stub prevents openid-client from ever loading.
 */

export function setupAuth(_app: Express) {
  console.log("Auth disabled (non-Replit environment)");
}

export function isAuthenticated(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  return next();
}
