console.log("🔥 SERVER INDEX EXECUTED 🔥");

import express, { type Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { registerRoutes } from "./routes";
import { seedDatabase } from "./seed";

const app = express();

/* -----------------------------
   CORS (FIRST)
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
   Cookies
------------------------------ */
app.use(cookieParser());

/* -----------------------------
   Body parsers
------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* -----------------------------
   Probe
------------------------------ */
app.get("/api/__probe", (req, res) => {
  res.json({
    probe: "ok",
    cookies: req.headers.cookie || null,
    time: new Date().toISOString(),
  });
});

/* -----------------------------
   Bootstrap
------------------------------ */
(async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Seed failed:", err);
  }

  registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  });

  const port = parseInt(process.env.PORT || "10000", 10);
  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();