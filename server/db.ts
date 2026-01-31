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
   (SAFE ON RENDER)
========================= */
export async function migratePrescriptions() {
  const client = await pool.connect();

  try {
    console.log("🔄 Checking prescriptions.image_urls column…");

    const check = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'image_urls'
    `);

    if (check.rowCount === 0) {
      console.log("🛠️ Adding image_urls column…");

      await client.query(`
        ALTER TABLE prescriptions
        ADD COLUMN image_urls JSONB
      `);

      // 🔁 Migrate legacy single-image data if it exists
      await client.query(`
        UPDATE prescriptions
        SET image_urls = jsonb_build_array(image_url)
        WHERE image_url IS NOT NULL
      `);

      console.log("✅ prescriptions.image_urls migration complete");
    } else {
      console.log("✅ prescriptions.image_urls already exists");
    }
  } catch (err) {
    console.error("❌ Prescription migration failed:", err);
  } finally {
    client.release();
  }
}