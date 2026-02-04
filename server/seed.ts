import { db } from "./db";
import { categories } from "@shared/schema";

const medicineCategories = [
  { name: "TABLETS", icon: "pill" },
  { name: "CAPSULES", icon: "capsule" },
  { name: "SYRUPS", icon: "syrup" },
  { name: "INJECTIONS", icon: "syringe" },
  { name: "TOPICALS", icon: "cream" },
  { name: "DROPS", icon: "drop" },
  { name: "POWDERS", icon: "powder" },
  { name: "MOUTHWASH", icon: "mouth" },
  { name: "INHALERS", icon: "inhaler" },
  { name: "DEVICES", icon: "device" },
  { name: "SCRUBS", icon: "scrub" },
  { name: "SOLUTIONS", icon: "solution" },
  { name: "NO CATEGORY", icon: "box" },
];

export async function seedDatabase() {
  console.log("🌱 Seeding categories...");

  const existing = await db.select().from(categories).limit(1);
  if (existing.length > 0) {
    console.log("ℹ️ Categories already exist, skipping");
    return;
  }

  await db.insert(categories).values(medicineCategories);
  console.log(`✅ Inserted ${medicineCategories.length} categories`);
}