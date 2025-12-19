import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ message: "Missing credential" });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload?.email) {
        return res.status(401).json({ message: "Invalid Google token" });
      }

      // 🔐 Issue OUR JWT
      const token = jwt.sign(
        {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        user: {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        },
      });
    } catch (err) {
      console.error("Google auth error:", err);
      res.status(401).json({ message: "Authentication failed" });
    }
  });
}
