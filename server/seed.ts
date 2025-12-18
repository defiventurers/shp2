import { db } from "./db";
import { categories, medicines } from "@shared/schema";

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

const medicineData = [
  /* 🔴 KEEP YOUR ENTIRE medicineData ARRAY EXACTLY AS IT IS 🔴 */
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

    // Insert categories
    const categoryMap = new Map<string, string>();
    for (const cat of medicineCategories) {
      const [inserted] = await db
        .insert(categories)
        .values(cat)
        .returning({ id: categories.id });

      categoryMap.set(cat.name, inserted.id);
    }

    console.log(`Inserted ${medicineCategories.length} categories`);

    // Insert medicines
    for (const med of medicineData) {
      const categoryId = categoryMap.get(med.category);
      if (!categoryId) continue;

      await db.insert(medicines).values({
        name: med.name,
        genericName: med.genericName,
        manufacturer: med.manufacturer,
        categoryId,
        dosage: med.dosage,
        form: med.form,
        packSize: med.packSize,
        price: med.price.toString(),
        mrp: med.mrp.toString(),
        stock: med.stock,
        requiresPrescription: med.requiresPrescription,
        isScheduleH: med.isScheduleH,
      });
    }

    console.log(`Inserted ${medicineData.length} medicines`);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
