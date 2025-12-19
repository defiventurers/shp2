import type { Express, Request, Response } from "express";
import passport from "passport";

export function registerAuthRoutes(app: Express) {
  // Start Google OAuth
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  // Google OAuth callback
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login",
      session: false,
    }),
    (req: Request, res: Response) => {
      // TEMP: redirect to frontend home
      res.redirect("https://shp2.vercel.app");
    }
  );

  // Auth health check (debug)
  app.get("/api/auth/health", (_req, res) => {
    res.json({ success: true });
  });
}
