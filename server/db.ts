import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { resolveCategoryNameFromRaw, sourceTokensForCategory } from "./utils/categoryMapping";

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

    const imageUrlsCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'image_urls'
    `);

    if (imageUrlsCheck.rowCount === 0) {
      await client.query(`
        ALTER TABLE prescriptions
        ADD COLUMN image_urls JSONB
      `);
    }

    const legacyCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'image_url'
    `);

    if (legacyCheck.rowCount > 0) {
      await client.query(`
        UPDATE prescriptions
        SET image_urls = jsonb_build_array(image_url)
        WHERE image_url IS NOT NULL
        AND image_urls IS NULL
      `);

      await client.query(`
        ALTER TABLE prescriptions
        ALTER COLUMN image_url DROP NOT NULL
      `);
    }

    const nameCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'name'
    `);

    if (nameCheck.rowCount === 0) {
      await client.query(`
        ALTER TABLE prescriptions
        ADD COLUMN name VARCHAR
      `);
    }

    const dateCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND column_name = 'prescription_date'
    `);

    if (dateCheck.rowCount === 0) {
      await client.query(`
        ALTER TABLE prescriptions
        ADD COLUMN prescription_date VARCHAR
      `);
    }

    const orderColumns = [
      ["discount_amount", "ALTER TABLE orders ADD COLUMN discount_amount NUMERIC(10,2) DEFAULT 0"],
      ["adjusted_total", "ALTER TABLE orders ADD COLUMN adjusted_total NUMERIC(10,2)"],
      ["pre_tax_subtotal", "ALTER TABLE orders ADD COLUMN pre_tax_subtotal NUMERIC(10,2)"],
      ["tax_amount", "ALTER TABLE orders ADD COLUMN tax_amount NUMERIC(10,2)"],
      ["tax_rate", "ALTER TABLE orders ADD COLUMN tax_rate NUMERIC(5,2) DEFAULT 12.00"],
      ["promo_code", "ALTER TABLE orders ADD COLUMN promo_code VARCHAR"],
      ["bill_image_url", "ALTER TABLE orders ADD COLUMN bill_image_url VARCHAR"],
    ] as const;

    for (const [columnName, ddl] of orderColumns) {
      const check = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = $1`,
        [columnName],
      );
      if (check.rowCount === 0) {
        await client.query(ddl);
      }
    }

    await client.query(`
      UPDATE orders
      SET adjusted_total = total
      WHERE adjusted_total IS NULL
    `);

    await client.query(`
      UPDATE orders
      SET pre_tax_subtotal = subtotal
      WHERE pre_tax_subtotal IS NULL
    `);

    await client.query(`
      UPDATE orders
      SET tax_amount = 0
      WHERE tax_amount IS NULL
    `);

    const categoryRows = await client.query(`SELECT id, name FROM categories`);
    const catMap: Record<string, string> = {};
    for (const row of categoryRows.rows) {
      catMap[String(row.name).toUpperCase()] = row.id;
    }

    const allTokens = sourceTokensForCategory("TABLETS")
      .concat(sourceTokensForCategory("CAPSULES"))
      .concat(sourceTokensForCategory("SYRUPS"))
      .concat(sourceTokensForCategory("INJECTIONS"))
      .concat(sourceTokensForCategory("TOPICALS"))
      .concat(sourceTokensForCategory("DROPS"))
      .concat(sourceTokensForCategory("POWDERS"))
      .concat(sourceTokensForCategory("MOUTHWASH"))
      .concat(sourceTokensForCategory("INHALERS"))
      .concat(sourceTokensForCategory("DEVICES"))
      .concat(sourceTokensForCategory("SCRUBS"))
      .concat(sourceTokensForCategory("SOLUTIONS"))
      .concat(sourceTokensForCategory("NO CATEGORY"));

    for (const token of Array.from(new Set(allTokens))) {
      const categoryName = resolveCategoryNameFromRaw(token, token);
      const categoryId = catMap[categoryName];
      if (!categoryId) continue;

      await client.query(
        `
          UPDATE medicines
          SET category_id = $1
          WHERE (category_id IS NULL OR category_id = '')
          AND UPPER(COALESCE(source_file, 'OTHERS')) = $2
        `,
        [categoryId, token],
      );
    }

    console.log("✅ Prescription migration complete");
  } catch (err) {
    console.error("❌ Prescription migration failed:", err);
  } finally {
    client.release();
  }
}
