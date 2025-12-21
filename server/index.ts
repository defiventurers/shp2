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
   Raw body support (payments)
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
   Request logging middleware
------------------------------ */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any;

  const originalResJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJsonResponse = body;
    return originalResJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(line);
    }
  });

  next();
});

/* -----------------------------
   🚨 PROBE ROUTE (DEPLOY CHECK)
------------------------------ */
app.get("/api/__probe", (req, res) => {
  res.json({
    probe: "ok",
    cookies: req.headers.cookie || null,
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

/* -----------------------------
   Bootstrap server
------------------------------ */
(async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  console.log("🔥 REGISTERING ROUTES 🔥");
  registerRoutes(app);

  // Express error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";
    console.error(err);
    res.status(status).json({ message });
  });

  // Vite dev only
  if (process.env.NODE_ENV !== "production") {
    const { setupVite } = await import("./vite");
    await setupVite(http.createServer(app), app);
  }

  // Render-required port
  const port = parseInt(process.env.PORT || "10000", 10);
  const server = http.createServer(app);

  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);
  });
})();