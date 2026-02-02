import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { seedDatabase } from "./seed";
import { migratePrescriptions } from "./db";

// ROUTES
import { registerAuthRoutes } from "./routes/auth";
import { registerUserRoutes } from "./routes/users";
import { registerMedicineRoutes } from "./routes/medicines";
import { registerCategoryRoutes } from "./routes/categories";
import { registerOrderRoutes } from "./routes/orders";
import { registerPrescriptionRoutes } from "./routes/prescriptions";
import { registerAdminImportRoutes } from "./routes/adminImport";

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
     BOOT TASKS (SAFE)
  ------------------------------ */
  await seedDatabase();
  await migratePrescriptions();

  /* -----------------------------
     ROUTES
  ------------------------------ */
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerMedicineRoutes(app);
  registerCategoryRoutes(app);
  registerOrderRoutes(app);
  registerPrescriptionRoutes(app);
  registerAdminImportRoutes(app); // 👈 ONLY IMPORT HOOK

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