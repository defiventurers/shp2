import type { Express } from "express";
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
      session: true,
    }),
    (_req, res) => {
      // Redirect back to frontend after successful login
      res.redirect("https://shp2.vercel.app");
    }
  );

  // Current logged-in user
  app.get("/api/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}

