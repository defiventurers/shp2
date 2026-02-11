import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

const DOSAGE_FORM_CATEGORY_NAMES = [
  "TABLETS",
  "CAPSULES",
  "INJECTIONS",
  "SYRUPS",
  "TOPICALS",
  "DROPS",
  "POWDERS",
  "MOUTHWASH",
  "INHALERS",
  "DEVICES",
  "SCRUBS",
  "SOLUTIONS",
  "NO CATEGORY",
] as const;

export async function seedDatabase() {
  console.log("🌱 Seeding dosage-form categories only (ALL CAPS, canonical)…");

  for (const name of DOSAGE_FORM_CATEGORY_NAMES) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(categories).values({ name });
      console.log(`➕ Inserted category: ${name}`);
    } else {
      console.log(`⏭️ Category exists: ${name}`);
    }
  }

  console.log("✅ Category seeding complete");
}
