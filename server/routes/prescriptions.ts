import type { Express, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import { and, eq } from "drizzle-orm";
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

  /* =====================================================
     CREATE PRESCRIPTION (1–5 IMAGES)
     POST /api/prescriptions/upload
  ===================================================== */
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
          const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.v2.uploader
              .upload_stream({ folder: "prescriptions" }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              })
              .end(file.buffer);
          });

          imageUrls.push(uploadResult.secure_url);
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

  /* =====================================================
     LIST USER PRESCRIPTIONS
     GET /api/prescriptions
  ===================================================== */
  app.get(
    "/api/prescriptions",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const rows = await db.query.prescriptions.findMany({
          where: (p, { eq }) => eq(p.userId, req.user!.id),
          orderBy: (p, { desc }) => [desc(p.createdAt)],
        });

        res.json(rows);
      } catch (err) {
        console.error("❌ Fetch prescriptions failed:", err);
        res.status(500).json({ error: "Failed to fetch prescriptions" });
      }
    }
  );

  /* =====================================================
     RENAME PRESCRIPTION
     PATCH /api/prescriptions/:id
  ===================================================== */
  app.patch(
    "/api/prescriptions/:id",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
          return res.status(400).json({ error: "Missing name" });
        }

        const [updated] = await db
          .update(prescriptions)
          .set({
            extractedMedicines: { meta: { name } }, // safe storage
          })
          .where(
            and(
              eq(prescriptions.id, id),
              eq(prescriptions.userId, req.user!.id)
            )
          )
          .returning();

        if (!updated) {
          return res.status(404).json({ error: "Not found" });
        }

        res.json({ success: true });
      } catch (err) {
        console.error("❌ Rename failed:", err);
        res.status(500).json({ error: "Rename failed" });
      }
    }
  );

  /* =====================================================
     ADD IMAGES TO EXISTING (MAX 5 TOTAL)
     POST /api/prescriptions/:id/images
  ===================================================== */
  app.post(
    "/api/prescriptions/:id/images",
    requireAuth,
    upload.array("images", 5),
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No images uploaded" });
        }

        const existing = await db.query.prescriptions.findFirst({
          where: (p, { and, eq }) =>
            and(eq(p.id, id), eq(p.userId, req.user!.id)),
        });

        if (!existing) {
          return res.status(404).json({ error: "Not found" });
        }

        const currentUrls = existing.imageUrls as string[];

        if (currentUrls.length + files.length > 5) {
          return res
            .status(400)
            .json({ error: "Maximum 5 images allowed" });
        }

        const newUrls: string[] = [];

        for (const file of files) {
          const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.v2.uploader
              .upload_stream({ folder: "prescriptions" }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              })
              .end(file.buffer);
          });

          newUrls.push(uploadResult.secure_url);
        }

        const updatedUrls = [...currentUrls, ...newUrls];

        await db
          .update(prescriptions)
          .set({ imageUrls: updatedUrls })
          .where(eq(prescriptions.id, id));

        res.json({ success: true, imageUrls: updatedUrls });
      } catch (err) {
        console.error("❌ Add images failed:", err);
        res.status(500).json({ error: "Add images failed" });
      }
    }
  );

  /* =====================================================
     REMOVE IMAGE BY INDEX
     DELETE /api/prescriptions/:id/images/:index
  ===================================================== */
  app.delete(
    "/api/prescriptions/:id/images/:index",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id, index } = req.params;
        const idx = Number(index);

        const existing = await db.query.prescriptions.findFirst({
          where: (p, { and, eq }) =>
            and(eq(p.id, id), eq(p.userId, req.user!.id)),
        });

        if (!existing) {
          return res.status(404).json({ error: "Not found" });
        }

        const urls = [...(existing.imageUrls as string[])];

        if (idx < 0 || idx >= urls.length) {
          return res.status(400).json({ error: "Invalid index" });
        }

        urls.splice(idx, 1);

        await db
          .update(prescriptions)
          .set({ imageUrls: urls })
          .where(eq(prescriptions.id, id));

        res.json({ success: true, imageUrls: urls });
      } catch (err) {
        console.error("❌ Remove image failed:", err);
        res.status(500).json({ error: "Remove image failed" });
      }
    }
  );

  /* =====================================================
     DELETE PRESCRIPTION
     DELETE /api/prescriptions/:id
  ===================================================== */
  app.delete(
    "/api/prescriptions/:id",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const { id } = req.params;

        await db
          .delete(prescriptions)
          .where(
            and(
              eq(prescriptions.id, id),
              eq(prescriptions.userId, req.user!.id)
            )
          );

        res.json({ success: true });
      } catch (err) {
        console.error("❌ Delete prescription failed:", err);
        res.status(500).json({ error: "Delete failed" });
      }
    }
  );
}