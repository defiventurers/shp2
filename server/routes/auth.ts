import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* -----------------------------
   Helpers
------------------------------ */
function setAuthCookie(res: Response, token: string) {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/* -----------------------------
   Routes
------------------------------ */
export function registerAuthRoutes(app: Express) {
  /* Health */
  app.get("/api/auth/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* Google login */
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: "Missing credential" });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };

      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

      setAuthCookie(res, token);

      res.json({ success: true, user });
    } catch (err) {
      console.error("Google auth error:", err);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  /* Current user */
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.json(null);
    }

    try {
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch {
      res.clearCookie("auth_token");
      res.json(null);
    }
  });

  /* Logout */
  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token");
    res.json({ success: true });
  });
}
