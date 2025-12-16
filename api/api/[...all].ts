import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createServer } from "http";

import { registerRoutes } from "../server/routes";
import { seedDatabase } from "../server/seed";
import { serveStatic } from "../server/static";

let server: any;
let app: any;

async function initServer() {
  if (server) return;

  app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  try {
    await seedDatabase();
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  const httpServer = await registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  server = httpServer;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initServer();
  // forward the request to the Express server
  // @ts-ignore
  server.emit("request", req, res);
}

