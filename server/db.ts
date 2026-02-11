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


    // 4️⃣ Ensure name column exists
    const nameCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'name'
    `);

    if (nameCheck.rowCount === 0) {
      console.log("🛠 Adding name column");

      await client.query(`
        ALTER TABLE prescriptions
        ADD COLUMN name VARCHAR
      `);
    }

    // 5️⃣ Ensure prescription_date column exists
    const dateCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'prescription_date'
    `);

    if (dateCheck.rowCount === 0) {
      console.log("🛠 Adding prescription_date column");

      await client.query(`
        ALTER TABLE prescriptions
        ADD COLUMN prescription_date VARCHAR
      `);
    }


    // 6️⃣ Ensure orders.discount_amount exists
    const discountCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name = 'discount_amount'
    `);

    if (discountCheck.rowCount === 0) {
      console.log("🛠 Adding discount_amount column");

      await client.query(`
        ALTER TABLE orders
        ADD COLUMN discount_amount NUMERIC(10,2) DEFAULT 0
      `);
    }

    // 7️⃣ Ensure orders.adjusted_total exists
    const adjustedCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND column_name = 'adjusted_total'
    `);

    if (adjustedCheck.rowCount === 0) {
      console.log("🛠 Adding adjusted_total column");

      await client.query(`
        ALTER TABLE orders
        ADD COLUMN adjusted_total NUMERIC(10,2)
      `);

      await client.query(`
        UPDATE orders
        SET adjusted_total = total
        WHERE adjusted_total IS NULL
      `);
    }


    // 8️⃣ Backfill medicines.category_id using source_file mapping
    const categoryRows = await client.query(`
      SELECT id, name FROM categories
    `);
    const catMap: Record<string, string> = {};
    for (const row of categoryRows.rows) {
      catMap[String(row.name).toUpperCase()] = row.id;
    }

    const sourceToCategory: Record<string, string> = {
      TABLETS: "TABLETS",
      CAPSULES: "CAPSULES",
      SYRUPS: "SYRUPS",
      INJECTIONS: "INJECTIONS",
  "DIABETIC INJECTIONS": "INJECTIONS",
      TOPICALS: "TOPICALS",
      DROPS: "DROPS",
      POWDERS: "POWDERS",
      MOUTHWASH: "MOUTHWASH",
      INHALERS: "INHALERS",
      DEVICES: "DEVICES",
      SCRUBS: "SCRUBS",
      SOLUTIONS: "SOLUTIONS",
      OTHERS: "NO CATEGORY",
      "NO CATEGORY": "NO CATEGORY",
    };

    for (const [sourceFile, categoryName] of Object.entries(sourceToCategory)) {
      const categoryId = catMap[categoryName];
      if (!categoryId) continue;

      await client.query(
        `
          UPDATE medicines
          SET category_id = $1
          WHERE (category_id IS NULL OR category_id = '')
          AND UPPER(COALESCE(source_file, 'OTHERS')) = $2
        `,
        [categoryId, sourceFile]
      );
    }

    console.log("✅ Prescription migration complete");
  } catch (err) {
    console.error("❌ Prescription migration failed:", err);
  } finally {
    client.release();
  }
}
