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

  /**
   * MULTI-PAGE PRESCRIPTION UPLOAD (1–5 images)
   */
  app.post(
    "/api/prescriptions/upload",
    requireAuth,
    upload.array("images", 5), // ✅ FIXED
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.files || !(req.files instanceof Array) || req.files.length === 0) {
          return res.status(400).json({ error: "No images uploaded" });
        }

        // Upload all images to Cloudinary
        const uploadedUrls: string[] = [];

        for (const file of req.files) {
          const result = await new Promise<any>((resolve, reject) => {
            cloudinary.v2.uploader
              .upload_stream(
                { folder: "prescriptions" },
                (err, result) => {
                  if (err) reject(err);
                  else resolve(result);
                }
              )
              .end(file.buffer);
          });

          uploadedUrls.push(result.secure_url);
        }

        // Save ONLY FIRST IMAGE as primary (others are pages)
        const [saved] = await db
          .insert(prescriptions)
          .values({
            userId: req.user!.id,
            imageUrl: uploadedUrls[0], // primary preview
            extractedMedicines: uploadedUrls, // store all pages
            status: "pending",
          })
          .returning();

        res.json({
          success: true,
          prescription: saved,
        });
      } catch (err) {
        console.error("Prescription upload failed:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  /**
   * LIST USER PRESCRIPTIONS
   */
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