import type { Express, Request, Response, NextFunction } from "express";

/**
 * Replit Auth ONLY works inside Replit.
 * On Render / Vercel, required env vars do not exist.
 * We safely disable auth outside Replit.
 */

const isReplit =
  !!process.env.REPLIT_CLIENT_ID &&
  !!process.env.REPL_ID &&
  !!process.env.REPL_OWNER;

export function setupAuth(_app: Express) {
  if (!isReplit) {
    console.log("Replit auth disabled (non-Replit environment)");
    return;
  }

  // ---- ORIGINAL REPLIT AUTH CODE WAS HERE ----
  // We intentionally do nothing on non-Replit hosts.
}

export function isAuthenticated(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  // Allow all requests when auth is disabled
  return next();
}
