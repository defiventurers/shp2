import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email?: string;
      name?: string;
    };

    // 🔥 ENSURE USER EXISTS IN DATABASE
    const existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, decoded.id),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: decoded.id,
        email: decoded.email || null,
        name: decoded.name || null,
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    console.error("AUTH VERIFY FAILED:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}