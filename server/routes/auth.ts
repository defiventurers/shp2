import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

const GOOGLE_JWT_AUD = process.env.GOOGLE_CLIENT_ID!;
const APP_JWT_SECRET = process.env.JWT_SECRET!;

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Missing credential" });
    }

    // Decode Google JWT (no network call needed)
    const payload = JSON.parse(
      Buffer.from(credential.split(".")[1], "base64").toString()
    );

    if (payload.aud !== GOOGLE_JWT_AUD) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const user = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    // Issue your own JWT
    const token = jwt.sign(user, APP_JWT_SECRET, {
      expiresIn: "7d",
    });

    res
      .cookie("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ success: true });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("auth_token").json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    try {
      const token = req.cookies?.auth_token;
      if (!token) return res.json(null);

      const user = jwt.verify(token, APP_JWT_SECRET);
      res.json(user);
    } catch {
      res.json(null);
    }
  });
}
