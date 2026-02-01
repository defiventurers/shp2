import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { seedDatabase } from "./seed";
import { migratePrescriptions } from "./db";
import { registerRoutes } from "./routes"; // ✅ CENTRAL ROUTE REGISTRY

console.log("🔥 SERVER INDEX EXECUTED 🔥");

const app = express();

/* -----------------------------
   CORS
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
   COOKIE PARSER
------------------------------ */
app.use(cookieParser());

/* -----------------------------
   BODY PARSERS
------------------------------ */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

/* -----------------------------
   DEBUG
------------------------------ */
app.get("/api/__probe", (_req, res) => {
  res.json({ status: "ok" });
});

/* -----------------------------
   BOOTSTRAP
------------------------------ */
(async () => {
  try {
    console.log("🌱 Seeding database...");
    await seedDatabase();

    console.log("🔄 Running prescription migration...");
    await migratePrescriptions();
  } catch (err) {
    console.error("Startup task failed:", err);
  }

  console.log("🌤️ Cloudinary configured:", {
    cloud: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    key: Boolean(process.env.CLOUDINARY_API_KEY),
    secret: Boolean(process.env.CLOUDINARY_API_SECRET),
  });

  // ✅ REGISTER **ALL** ROUTES HERE
  registerRoutes(app);

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