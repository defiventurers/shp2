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
   Multer (memory)
------------------------------ */
const upload = multer({
  storage: multer.memoryStorage(),
});

/* -----------------------------
   Routes
------------------------------ */
export function registerPrescriptionRoutes(app: Express) {
  console.log("🔥 PRESCRIPTION ROUTES REGISTERED 🔥");

  app.post(
    "/api/prescriptions/upload",
    requireAuth,
    upload.array("images", 5),
    async (req: AuthRequest, res: Response) => {
      try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No images uploaded" });
        }

        const imageUrls: string[] = [];

        for (const file of files) {
          const result = await new Promise<any>((resolve, reject) => {
            cloudinary.v2.uploader
              .upload_stream({ folder: "prescriptions" }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              })
              .end(file.buffer);
          });

          imageUrls.push(result.secure_url);
        }

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
        console.error("❌ Prescription upload failed:", err);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );
}