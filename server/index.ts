import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import { seedDatabase } from "./seed";

// 🔥 Explicit route imports (NO indirection)
import { registerAuthRoutes } from "./routes/auth";
import { registerMedicineRoutes } from "./routes/medicines";
import { registerCategoryRoutes } from "./routes/categories";
import { registerOrderRoutes } from "./routes/orders";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

console.log("🔥 SERVER INDEX EXECUTED 🔥");

const app = express();

/* -----------------------------
   ✅ CORS (MUST BE FIRST)
------------------------------ */
app.use(
  cors({
    origin: [
      "https://shp2.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

/* -----------------------------
   ✅ COOKIE PARSER (REQUIRED)
------------------------------ */
app.use(cookieParser());

/* -----------------------------
   BODY PARSERS
------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* -----------------------------
   🔎 DEBUG AUTH ENDPOINT
------------------------------ */
app.get("/api/debug/auth", (req, res) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.json({
      hasCookie: false,
      token: null,
      user: null,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.json({
      hasCookie: true,
      token: token.slice(0, 20) + "...",
      user: decoded,
    });
  } catch (err) {
    console.error("JWT VERIFY FAILED:", err);
    return res.json({
      hasCookie: true,
      token: "INVALID",
      user: null,
      error: "JWT verification failed",
    });
  }
});

/* -----------------------------
   HEALTH / PROBE
------------------------------ */
app.get("/api/__probe", (_req, res) => {
  res.json({ status: "ok" });
});

/* -----------------------------
   BOOTSTRAP SERVER
------------------------------ */
(async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  console.log("🔥 REGISTERING ROUTES 🔥");

  // 🔥 Explicit registration order
  registerAuthRoutes(app);
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);

  /* -----------------------------
     ERROR HANDLER
  ------------------------------ */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("UNHANDLED ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  /* -----------------------------
     START SERVER
  ------------------------------ */
  const port = parseInt(process.env.PORT || "10000", 10);

  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();