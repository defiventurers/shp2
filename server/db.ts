import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
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
   (SAFE on Render Free Tier)
========================= */
export async function migratePrescriptions() {
  const client = await pool.connect();

  try {
    console.log("🔄 Running prescriptions migration…");

    // 1️⃣ Ensure image_urls exists
    const imageUrlsCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'image_urls'
    `);

    if (imageUrlsCheck.rowCount === 0) {
      console.log("🛠 Adding image_urls column");

      await client.query(`
        ALTER TABLE prescriptions
        ADD COLUMN image_urls JSONB
      `);
    }

    // 2️⃣ Migrate legacy image_url → image_urls[]
    const legacyCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'image_url'
    `);

    if (legacyCheck.rowCount > 0) {
      console.log("🔁 Migrating legacy image_url → image_urls[]");

      await client.query(`
        UPDATE prescriptions
        SET image_urls = jsonb_build_array(image_url)
        WHERE image_url IS NOT NULL
        AND image_urls IS NULL
      `);

      // 3️⃣ Drop NOT NULL constraint on image_url
      console.log("🧹 Removing NOT NULL constraint on image_url");

      await client.query(`
        ALTER TABLE prescriptions
        ALTER COLUMN image_url DROP NOT NULL
      `);
    }

    console.log("✅ Prescription migration complete");
  } catch (err) {
    console.error("❌ Prescription migration failed:", err);
  } finally {
    client.release();
  }
}