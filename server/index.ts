console.log("🔥 SERVER INDEX EXECUTED 🔥");

import express, { type Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { registerRoutes } from "./routes";
import { seedDatabase } from "./seed";

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
   ✅ Cookies (REQUIRED FOR AUTH)
------------------------------ */
app.use(cookieParser());

/* -----------------------------
   Raw body support
------------------------------ */
declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

/* -----------------------------
   Body parsers
------------------------------ */
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

/* -----------------------------
   Logger
------------------------------ */
export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${time} [${source}] ${message}`);
}

/* -----------------------------
   Request logging
------------------------------ */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });

  next();
});

/* -----------------------------
   Probe route
------------------------------ */
app.get("/api/__probe", (_req, res) => {
  res.json({ probe: "ok" });
});

/* -----------------------------
   Bootstrap
------------------------------ */
(async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  // ✅ SINGLE place where ALL routes are registered
  registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  });

  const port = parseInt(process.env.PORT || "10000", 10);
  http.createServer(app).listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);
  });
})();