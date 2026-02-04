// server/seed.ts

import { db } from "./db";
import { categories } from "@shared/schema";

/**
 * Canonical medicine categories
 * Minimal, stable, CSV-aligned
 */
const medicineCategories = [
  { name: "TABLETS", icon: "pill" },
  { name: "CAPSULES", icon: "capsule" },
  { name: "SYRUPS", icon: "syrup" },
  { name: "INJECTIONS", icon: "syringe" },
  { name: "TOPICALS", icon: "cream" },
  { name: "DROPS", icon: "drop" },
  { name: "OTHERS", icon: "box" },
];

export async function seedDatabase() {
  console.log("🌱 Seeding categories...");

  try {
    // ✅ Idempotent guard
    const existing = await db.select().from(categories).limit(1);
    if (existing.length > 0) {
      console.log("ℹ️ Categories already exist, skipping seed");
      return;
    }

    await db.insert(categories).values(medicineCategories);

    console.log(`✅ Inserted ${medicineCategories.length} categories`);
  } catch (error) {
    console.error("❌ Category seeding failed:", error);
    throw error;
  }
}