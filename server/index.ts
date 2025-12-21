console.log("🔥 SERVER INDEX EXECUTED 🔥");

import express, { type Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { registerRoutes } from "./routes";
import { seedDatabase } from "./seed";

const app = express();

/* =====================================================
   CORS — MUST BE FIRST, SINGLE EXACT ORIGIN
===================================================== */
app.use(
  cors({
    origin: "https://shp2.vercel.app", // ⚠️ EXACT MATCH ONLY
    credentials: true,
  })
);

/* =====================================================
   COOKIES — REQUIRED FOR JWT AUTH
===================================================== */
app.use(cookieParser());

/* =====================================================
   RAW BODY SUPPORT (payments / webhooks safe)
===================================================== */
declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

/* =====================================================
   BODY PARSERS
===================================================== */
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

/* =====================================================
   REQUEST LOGGER
===================================================== */
export function log(message: string, source = "express") {
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${time} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => originalJson(body);

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });

  next();
});

/* =====================================================
   🔍 DEBUG ROUTE — DO NOT REMOVE UNTIL FIXED
===================================================== */
app.get("/api/debug-cookie", (req, res) => {
  res.json({
    cookies: req.cookies,
    hasAuthToken: !!req.cookies?.auth_token,
  });
});

/* =====================================================
   BOOTSTRAP SERVER
===================================================== */
(async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  console.log("🔥 REGISTERING ROUTES 🔥");

  // ⬇️ Registers auth, medicines, categories, orders
  registerRoutes(app);

  /* ---------------------------------------------------
     GLOBAL ERROR HANDLER
  ---------------------------------------------------- */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(err?.status || 500).json({
      message: err?.message || "Internal Server Error",
    });
  });

  /* ---------------------------------------------------
     DEV ONLY — Vite
  ---------------------------------------------------- */
  if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    await setupVite(http.createServer(app), app);
  }

  /* ---------------------------------------------------
     START SERVER (Render requirement)
  ---------------------------------------------------- */
  const port = parseInt(process.env.PORT || "10000", 10);
  const server = http.createServer(app);

  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);
  });
})();