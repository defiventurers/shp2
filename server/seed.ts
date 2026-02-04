import { db } from "./db";
import { categories } from "@shared/schema";

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
  console.log("🌱 Seeding categories...");

  const existing = await db.select().from(categories).limit(1);
  if (existing.length) {
    console.log("✅ Categories already exist, skipping seed");
    return;
  }

  for (const name of CATEGORY_NAMES) {
    await db.insert(categories).values({ name });
  }

  console.log(`✅ Seeded ${CATEGORY_NAMES.length} categories`);
}