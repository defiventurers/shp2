import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

/* -----------------------------
   STARTUP TASKS
------------------------------ */
import { seedDatabase } from "./seed";
import { migratePrescriptions } from "./db";
import { db } from "./db";

/* -----------------------------
   ROUTES
------------------------------ */
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
     CORS — SINGLE DOMAIN ONLY
  ------------------------------ */
  app.use(
    cors({
      origin: ["https://shpharma.vercel.app"],
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
     SCHEMA SAFETY FIXES
  ------------------------------ */
  try {
    console.log("🧹 Ensuring MRP is nullable");
    await db.execute(`
      ALTER TABLE medicines
      ALTER COLUMN mrp DROP NOT NULL
    `);
  } catch {}

  try {
    console.log("🧹 Ensuring stock is nullable");
    await db.execute(`
      ALTER TABLE medicines
      ALTER COLUMN stock DROP NOT NULL
    `);
  } catch {}

  try {
    console.log("🧹 Ensuring pack_size column exists");
    await db.execute(`
      ALTER TABLE medicines
      ADD COLUMN IF NOT EXISTS pack_size INTEGER
    `);
  } catch {}

  /* -----------------------------
     ROUTES
  ------------------------------ */
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
  registerPrescriptionRoutes(app);
  registerAdminRoutes(app); // 🔥 ONLY place inventory import lives

  /* -----------------------------
     ERROR HANDLER
  ------------------------------ */
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("UNHANDLED ERROR:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  );

  /* -----------------------------
     START SERVER
  ------------------------------ */
  const port = Number(process.env.PORT || 10000);
  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

startServer();