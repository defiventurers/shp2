import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { seedDatabase } from "./seed";

// 🔥 FORCE-IMPORT ROUTES (PREVENT TREE-SHAKING)
import { registerAuthRoutes } from "./routes/auth";
import { registerMedicineRoutes } from "./routes/medicines";
import { registerCategoryRoutes } from "./routes/categories";
import { registerOrderRoutes } from "./routes/orders";

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
   🔥 COOKIE PARSER — MUST BE HERE
------------------------------ */
app.use(cookieParser());

/* -----------------------------
   BODY PARSERS
------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* -----------------------------
   PROBE
------------------------------ */
app.get("/api/__probe", (_req, res) => {
  res.json({ status: "ok" });
});

/* -----------------------------
   BOOTSTRAP
------------------------------ */
(async () => {
  await seedDatabase();

  // 🔥 REGISTER ROUTES EXPLICITLY (NO index.ts indirection)
  registerAuthRoutes(app);
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  const port = parseInt(process.env.PORT || "10000", 10);
  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on ${port}`);
  });
})();