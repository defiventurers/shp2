import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { seedDatabase } from "./seed";

// 🔥 FORCE IMPORT ROUTES (NO TREE SHAKING)
import { registerAuthRoutes } from "./routes/auth";
import { registerMedicineRoutes } from "./routes/medicines";
import { registerCategoryRoutes } from "./routes/categories";
import { registerOrderRoutes } from "./routes/orders";

console.log("🔥 SERVER INDEX EXECUTED 🔥");

const app = express();

/* -----------------------------
   CORS — MUST BE FIRST
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
   COOKIE PARSER — REQUIRED
------------------------------ */
app.use(cookieParser());

/* -----------------------------
   BODY PARSERS
------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* -----------------------------
   🔍 DEBUG AUTH ENDPOINT
   (THIS IS THE KEY)
------------------------------ */
app.get("/api/debug/auth", (req: Request, res: Response) => {
  res.json({
    cookies: req.cookies,
    hasAuthToken: Boolean(req.cookies?.auth_token),
    headers: {
      origin: req.headers.origin,
      cookie: req.headers.cookie,
    },
  });
});

/* -----------------------------
   PROBE (DEPLOY CHECK)
------------------------------ */
app.get("/api/__probe", (_req, res) => {
  res.json({ status: "ok" });
});

/* -----------------------------
   BOOTSTRAP
------------------------------ */
(async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Seed failed:", err);
  }

  // 🔥 REGISTER ROUTES EXPLICITLY
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

  const port = parseInt(process.env.PORT || "10000", 10);

  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();