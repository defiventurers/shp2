import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type AuthRequest = Request & {
  user?: any;
};

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}