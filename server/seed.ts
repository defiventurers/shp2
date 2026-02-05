import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

const CATEGORY_NAMES = [
  "TABLETS",
  "CAPSULES",
  "SYRUPS",
  "INJECTIONS",
  "TOPICALS",
  "DROPS",
  "POWDERS",
  "MOUTHWASH",
  "INHALERS",
  "DEVICES",
  "SCRUBS",
  "SOLUTIONS",
  "NO CATEGORY",
];

export async function seedDatabase() {
  console.log("🌱 Seeding categories (ALL CAPS, canonical)…");

  for (const name of CATEGORY_NAMES) {
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