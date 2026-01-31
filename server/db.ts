import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

const { Pool } = pg;

/* =========================
   Postgres Pool
========================= */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* =========================
   Drizzle DB
========================= */
export const db = drizzle(pool, { schema });

/* =========================
   🔄 Runtime Migration
   (SAFE ON RENDER)
========================= */
export async function migratePrescriptions() {
  const client = await pool.connect();

  try {
    console.log("🔄 Checking prescriptions legacy columns…");

    /* 1️⃣ Ensure image_urls exists */
    const imageUrlsCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'image_urls'
    `);

    if (imageUrlsCheck.rowCount === 0) {
      console.log("🛠️ Adding image_urls column…");
      await client.query(`
        ALTER TABLE prescriptions
        ADD COLUMN image_urls JSONB
      `);
    }

    /* 2️⃣ Check legacy image_url */
    const imageUrlCheck = await client.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'image_url'
    `);

    if (imageUrlCheck.rowCount > 0) {
      console.log("⚠️ Legacy image_url column detected");

      /* 3️⃣ Drop NOT NULL constraint */
      await client.query(`
        ALTER TABLE prescriptions
        ALTER COLUMN image_url DROP NOT NULL
      `);

      /* 4️⃣ Migrate old data */
      await client.query(`
        UPDATE prescriptions
        SET image_urls = jsonb_build_array(image_url)
        WHERE image_url IS NOT NULL
          AND image_urls IS NULL
      `);

      console.log("✅ Legacy image_url fixed & migrated");
    }

    console.log("✅ Prescription schema verified");
  } catch (err) {
    console.error("❌ Prescription migration failed:", err);
  } finally {
    client.release();
  }
}