import type { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";

export function registerAuthRoutes(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        return done(null, {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
        });
      }
    )
  );

  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login",
      session: true,
    }),
    (_req, res) => {
      res.redirect("https://shp2.vercel.app");
    }
  );

  app.get("/api/user", (req, res) => {
    res.json({ user: req.user ?? null });
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}
