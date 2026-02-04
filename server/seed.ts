import { db } from "./db";
import { categories } from "@shared/schema";

const CATEGORY_LIST = [
  "TABLETS",
  "CAPSULES",
  "SYRUPS",
  "INJECTIONS",
  "TOPICALS",
  "DROPS",
  "Powders",
  "Mouthwash",
  "Inhalers",
  "Devices",
  "Scrubs",
  "Solutions",
  "No category",
];

export async function seedDatabase() {
  console.log("🌱 Seeding categories...");

  try {
    const existing = await db.select().from(categories).limit(1);
    if (existing.length > 0) {
      console.log("✅ Categories already exist, skipping seed");
      return;
    }

    for (const name of CATEGORY_LIST) {
      await db.insert(categories).values({ name });
    }

    console.log(`✅ Inserted ${CATEGORY_LIST.length} categories`);
  } catch (error) {
    console.error("❌ Category seeding failed:", error);
    throw error;
  }
}