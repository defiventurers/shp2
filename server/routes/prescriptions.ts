import type { Express, Response } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { db } from "../db";
import { prescriptions } from "@shared/schema";
import { requireAuth, AuthRequest } from "../middleware/requireAuth";

/* -----------------------------
   Cloudinary config
------------------------------ */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

console.log("🌤️ Cloudinary configured:", {
  cloud: !!process.env.CLOUDINARY_CLOUD_NAME,
  key: !!process.env.CLOUDINARY_API_KEY,
  secret: !!process.env.CLOUDINARY_API_SECRET,
});

/* -----------------------------
   Multer (memory upload)
------------------------------ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
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
        console.log("📥 Prescription upload hit");

        if (!req.file) {
          return res.status(400).json({ error: "No image uploaded" });
        }

        if (!req.file.mimetype.startsWith("image/")) {
          return res.status(400).json({ error: "Invalid file type" });
        }

        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "prescriptions",
                resource_type: "image",
              },
              (err, result) => {
                if (err) {
                  console.error("❌ Cloudinary error:", err);
                  reject(err);
                } else {
                  resolve(result);
                }
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
        console.error("❌ Prescription upload failed:", err);
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