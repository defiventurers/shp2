import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

// startup tasks
import { seedDatabase } from "./seed";
import { migratePrescriptions } from "./db";
import { db } from "./db"; // ✅ REQUIRED FOR MIGRATION

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
     MIDDLEWARE
  ------------------------------ */
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));

  /* -----------------------------
     HEALTH
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
     🔧 ONE-TIME SCHEMA FIXES
     (SAFE TO RUN MULTIPLE TIMES)
  ------------------------------ */
  try {
    console.log("🧹 Ensuring MRP is nullable");
    await db.execute(`
      ALTER TABLE medicines
      ALTER COLUMN mrp DROP NOT NULL
    `);
    console.log("✅ MRP constraint removed (or already nullable)");
  } catch (err: any) {
    // Postgres throws error if already nullable — ignore safely
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
  registerAdminRoutes(app); // ✅ REQUIRED

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
  const port = Number(process.env.PORT || 10000);

  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

startServer();