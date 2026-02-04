import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { seedDatabase } from "./seed";
import { migratePrescriptions } from "./db";
import { db } from "./db";

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

  app.use(
    cors({
      origin: ["https://shpharma.vercel.app"],
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));

  app.get("/api/__probe", (_req, res) => {
    res.json({ status: "ok" });
  });

  await seedDatabase();
  await migratePrescriptions();

  try {
    await db.execute(`
      ALTER TABLE medicines
      ADD COLUMN IF NOT EXISTS source_file TEXT
    `);
  } catch {}

  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
  registerPrescriptionRoutes(app);
  registerAdminRoutes(app); // ✅ ONLY PLACE FOR IMPORT ROUTE

  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("UNHANDLED ERROR:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  );

  const port = Number(process.env.PORT || 10000);
  http.createServer(app).listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

startServer();