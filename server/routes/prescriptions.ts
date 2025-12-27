import type { Express, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import { db } from "../db";
import { prescriptions } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";

/* -----------------------------
   Cloudinary config
------------------------------ */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/* -----------------------------
   Multer (memory upload)
------------------------------ */
const upload = multer({ storage: multer.memoryStorage() });

export function registerPrescriptionRoutes(app: Express) {
  console.log("🔥 PRESCRIPTION ROUTES REGISTERED 🔥");

  /* MULTI-PAGE UPLOAD */
  app.post(
    "/api/prescriptions/upload",
    requireAuth,
    upload.array("images", 10),
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.files || !Array.isArray(req.files)) {
          return res.status(400).json({ error: "No images uploaded" });
        }

        const imageUrls = await Promise.all(
          req.files.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                cloudinary.v2.uploader
                  .upload_stream(
                    { folder: "prescriptions" },
                    (err, result) => {
                      if (err) reject(err);
                      else resolve(result!.secure_url);
                    }
                  )
                  .end(file.buffer);
              })
          )
        );

        const [saved] = await db
          .insert(prescriptions)
          .values({
            userId: req.user!.id,
            imageUrls,
            status: "pending",
          })
          .returning();

        res.json({ success: true, prescription: saved });
      } catch (err) {
        console.error("Upload failed:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  /* LIST */
  app.get(
    "/api/prescriptions",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      const data = await db.query.prescriptions.findMany({
        where: (p, { eq }) => eq(p.userId, req.user!.id),
        orderBy: (p, { desc }) => [desc(p.createdAt)],
      });

      res.json(data);
    }
  );
}