import { db } from "./db";
import { categories } from "@shared/schema";

const medicineCategories = [
  { name: "Pain Relief", icon: "pill" },
  { name: "Antibiotics", icon: "capsule" },
  { name: "Vitamins & Supplements", icon: "vitamin" },
  { name: "Digestive Health", icon: "stomach" },
  { name: "Cold & Flu", icon: "cold" },
  { name: "Diabetes Care", icon: "diabetes" },
  { name: "Heart Health", icon: "heart" },
  { name: "Skin Care", icon: "skin" },
  { name: "Eye Care", icon: "eye" },
  { name: "First Aid", icon: "bandage" },
];

export async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // ✅ SAFE idempotent guard (DO NOT REMOVE)
    const existing = await db.select().from(categories).limit(1);
    if (existing.length > 0) {
      console.log("Database already seeded, skipping");
      return;
    }

    // ✅ INSERT ONLY CATEGORIES
    for (const cat of medicineCategories) {
      await db.insert(categories).values(cat);
    }

    console.log(`Inserted ${medicineCategories.length} categories`);
    console.log("Database seeded successfully (categories only)");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}