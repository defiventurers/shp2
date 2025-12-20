import type { Express } from "express";

/**
 * 🚨 FORCE SIDE-EFFECT IMPORTS
 * These imports MUST stay or esbuild removes the routes.
 */
import "./auth";
import "./medicines";
import "./categories";
import "./orders";

/**
 * Each route file self-registers
 */
export function registerRoutes(_app: Express) {
  console.log("✅ registerRoutes executed");
}
