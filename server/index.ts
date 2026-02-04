import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

// startup tasks
import { seedDatabase } from "./seed";
import { migratePrescriptions } from "./db";
import { db } from "./db";

// routes
import { registerAuthRoutes } from "./routes/auth";
import { registerUserRoutes } from "./routes/users";
import { registerMedicineRoutes } from "./routes/medicines";
import { registerCategoryRoutes } from "./routes/categories";
import { registerOrderRoutes } from "./routes/orders";
import { registerPrescriptionRoutes } from "./routes/prescriptions";
import { registerAdminRoutes } from "./routes/admin";

console.log("🔥 SERVER INDEX EXECUTED 🔥");

async function startServer() {
  const app = express();

  /* -----------------------------
     ✅ CORS (FINAL – SINGLE DOMAIN)
  ------------------------------ */
  app.use(
    cors({
      origin: "https://shpharma.vercel.app", // ✅ ONLY allowed frontend
      credentials: true,                     // ✅ REQUIRED for cookies
    })
  );

  /* -----------------------------
     MIDDLEWARE
  ------------------------------ */
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));

  /* -----------------------------
     HEALTH CHECK
  ------------------------------ */
  app.get("/api/__probe", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* -----------------------------
     STARTUP TASKS
  ------------------------------ */
  await seedDatabase();
  await migratePrescriptions();

  /* -----------------------------
     SAFE SCHEMA FIXES
  ------------------------------ */
  try {
    console.log("🧹 Ensuring MRP is nullable");
    await db.execute(`
      ALTER TABLE medicines
      ALTER COLUMN mrp DROP NOT NULL
    `);
    console.log("✅ MRP constraint removed (or already nullable)");
  } catch {
    console.log("ℹ️ MRP already nullable, skipping");
  }

  /* -----------------------------
     ROUTES
  ------------------------------ */
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
  registerPrescriptionRoutes(app);
  registerAdminRoutes(app);

  /* -----------------------------
     ERROR HANDLER
  ------------------------------ */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("❌ UNHANDLED ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  /* -----------------------------
     START SERVER
  ------------------------------ */
  const port = Number(process.env.PORT || 10000);

  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

startServer();