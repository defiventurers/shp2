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
const upload = multer({
  storage: multer.memoryStorage(),
});

/* -----------------------------
   Routes
------------------------------ */
export function registerPrescriptionRoutes(app: Express) {
  console.log("🔥 PRESCRIPTION ROUTES REGISTERED 🔥");

  // Upload prescription image
  app.post(
    "/api/prescriptions/upload",
    requireAuth,
    upload.single("image"),
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image uploaded" });
        }

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.v2.uploader
            .upload_stream(
              { folder: "prescriptions" },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            )
            .end(req.file.buffer);
        });

        const [saved] = await db
          .insert(prescriptions)
          .values({
            userId: req.user!.id,
            imageUrl: uploadResult.secure_url,
            status: "pending",
          })
          .returning();

        res.json({
          success: true,
          prescription: saved,
          extractedMedicines: [],
        });
      } catch (err) {
        console.error("Prescription upload failed:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  // List user prescriptions
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
