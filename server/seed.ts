import { db } from "./db";
import { categories, medicines, users } from "@shared/schema";

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
  // Pain Relief
  { name: "Paracetamol 500mg", genericName: "Paracetamol", manufacturer: "Cipla", category: "Pain Relief", dosage: "500mg", form: "Tablet", packSize: "Strip of 15", price: 25, mrp: 30, stock: 150, requiresPrescription: false, isScheduleH: false },
  { name: "Dolo 650", genericName: "Paracetamol", manufacturer: "Micro Labs", category: "Pain Relief", dosage: "650mg", form: "Tablet", packSize: "Strip of 15", price: 32, mrp: 38, stock: 200, requiresPrescription: false, isScheduleH: false },
  { name: "Crocin Advance", genericName: "Paracetamol", manufacturer: "GSK", category: "Pain Relief", dosage: "500mg", form: "Tablet", packSize: "Strip of 15", price: 28, mrp: 35, stock: 180, requiresPrescription: false, isScheduleH: false },
  { name: "Combiflam", genericName: "Ibuprofen + Paracetamol", manufacturer: "Sanofi", category: "Pain Relief", dosage: "400mg+325mg", form: "Tablet", packSize: "Strip of 20", price: 45, mrp: 52, stock: 120, requiresPrescription: false, isScheduleH: false },
  { name: "Brufen 400", genericName: "Ibuprofen", manufacturer: "Abbott", category: "Pain Relief", dosage: "400mg", form: "Tablet", packSize: "Strip of 15", price: 35, mrp: 42, stock: 90, requiresPrescription: false, isScheduleH: false },
  { name: "Saridon", genericName: "Propyphenazone + Paracetamol", manufacturer: "Bayer", category: "Pain Relief", dosage: "150mg+250mg", form: "Tablet", packSize: "Strip of 10", price: 48, mrp: 55, stock: 75, requiresPrescription: false, isScheduleH: false },
  { name: "Disprin", genericName: "Aspirin", manufacturer: "Reckitt", category: "Pain Relief", dosage: "350mg", form: "Tablet", packSize: "Strip of 10", price: 15, mrp: 20, stock: 100, requiresPrescription: false, isScheduleH: false },
  { name: "Volini Gel", genericName: "Diclofenac", manufacturer: "Sun Pharma", category: "Pain Relief", dosage: "1%", form: "Gel", packSize: "30g", price: 85, mrp: 99, stock: 60, requiresPrescription: false, isScheduleH: false },
  { name: "Moov Cream", genericName: "Diclofenac + Menthol", manufacturer: "Reckitt", category: "Pain Relief", dosage: "1%", form: "Cream", packSize: "50g", price: 95, mrp: 115, stock: 55, requiresPrescription: false, isScheduleH: false },
  { name: "Ultracet", genericName: "Tramadol + Paracetamol", manufacturer: "Johnson & Johnson", category: "Pain Relief", dosage: "37.5mg+325mg", form: "Tablet", packSize: "Strip of 10", price: 125, mrp: 150, stock: 40, requiresPrescription: true, isScheduleH: true },
  
  // Antibiotics
  { name: "Azithromycin 500", genericName: "Azithromycin", manufacturer: "Cipla", category: "Antibiotics", dosage: "500mg", form: "Tablet", packSize: "Strip of 3", price: 95, mrp: 120, stock: 80, requiresPrescription: true, isScheduleH: true },
  { name: "Azee 500", genericName: "Azithromycin", manufacturer: "Cipla", category: "Antibiotics", dosage: "500mg", form: "Tablet", packSize: "Strip of 3", price: 90, mrp: 110, stock: 70, requiresPrescription: true, isScheduleH: true },
  { name: "Augmentin 625", genericName: "Amoxicillin + Clavulanic Acid", manufacturer: "GSK", category: "Antibiotics", dosage: "625mg", form: "Tablet", packSize: "Strip of 10", price: 280, mrp: 320, stock: 50, requiresPrescription: true, isScheduleH: true },
  { name: "Amoxyclav 625", genericName: "Amoxicillin + Clavulanic Acid", manufacturer: "Alkem", category: "Antibiotics", dosage: "625mg", form: "Tablet", packSize: "Strip of 10", price: 250, mrp: 290, stock: 45, requiresPrescription: true, isScheduleH: true },
  { name: "Ciprofloxacin 500", genericName: "Ciprofloxacin", manufacturer: "Ranbaxy", category: "Antibiotics", dosage: "500mg", form: "Tablet", packSize: "Strip of 10", price: 65, mrp: 85, stock: 60, requiresPrescription: true, isScheduleH: true },
  { name: "Ciplox 500", genericName: "Ciprofloxacin", manufacturer: "Cipla", category: "Antibiotics", dosage: "500mg", form: "Tablet", packSize: "Strip of 10", price: 70, mrp: 90, stock: 55, requiresPrescription: true, isScheduleH: true },
  { name: "Doxycycline 100", genericName: "Doxycycline", manufacturer: "Sun Pharma", category: "Antibiotics", dosage: "100mg", form: "Capsule", packSize: "Strip of 10", price: 55, mrp: 70, stock: 65, requiresPrescription: true, isScheduleH: true },
  { name: "Cefixime 200", genericName: "Cefixime", manufacturer: "Lupin", category: "Antibiotics", dosage: "200mg", form: "Tablet", packSize: "Strip of 10", price: 185, mrp: 220, stock: 40, requiresPrescription: true, isScheduleH: true },
  { name: "Metronidazole 400", genericName: "Metronidazole", manufacturer: "Alkem", category: "Antibiotics", dosage: "400mg", form: "Tablet", packSize: "Strip of 15", price: 35, mrp: 45, stock: 80, requiresPrescription: true, isScheduleH: true },
  { name: "Norfloxacin 400", genericName: "Norfloxacin", manufacturer: "Cipla", category: "Antibiotics", dosage: "400mg", form: "Tablet", packSize: "Strip of 10", price: 45, mrp: 60, stock: 50, requiresPrescription: true, isScheduleH: true },
  
  // Vitamins & Supplements
  { name: "Becosules Capsule", genericName: "Vitamin B Complex", manufacturer: "Pfizer", category: "Vitamins & Supplements", dosage: "", form: "Capsule", packSize: "Strip of 20", price: 32, mrp: 40, stock: 150, requiresPrescription: false, isScheduleH: false },
  { name: "Supradyn Daily", genericName: "Multivitamin", manufacturer: "Bayer", category: "Vitamins & Supplements", dosage: "", form: "Tablet", packSize: "Strip of 15", price: 75, mrp: 90, stock: 100, requiresPrescription: false, isScheduleH: false },
  { name: "Revital H", genericName: "Multivitamin + Ginseng", manufacturer: "Sun Pharma", category: "Vitamins & Supplements", dosage: "", form: "Capsule", packSize: "Strip of 30", price: 295, mrp: 350, stock: 80, requiresPrescription: false, isScheduleH: false },
  { name: "Shelcal 500", genericName: "Calcium + Vitamin D3", manufacturer: "Torrent", category: "Vitamins & Supplements", dosage: "500mg", form: "Tablet", packSize: "Strip of 15", price: 145, mrp: 175, stock: 90, requiresPrescription: false, isScheduleH: false },
  { name: "Calcimax 500", genericName: "Calcium + Vitamin D3", manufacturer: "Meyer", category: "Vitamins & Supplements", dosage: "500mg", form: "Tablet", packSize: "Strip of 30", price: 265, mrp: 310, stock: 70, requiresPrescription: false, isScheduleH: false },
  { name: "Evion 400", genericName: "Vitamin E", manufacturer: "Merck", category: "Vitamins & Supplements", dosage: "400mg", form: "Capsule", packSize: "Strip of 10", price: 35, mrp: 45, stock: 120, requiresPrescription: false, isScheduleH: false },
  { name: "Zincovit", genericName: "Zinc + Multivitamin", manufacturer: "Apex", category: "Vitamins & Supplements", dosage: "", form: "Tablet", packSize: "Strip of 15", price: 65, mrp: 80, stock: 85, requiresPrescription: false, isScheduleH: false },
  { name: "Limcee 500", genericName: "Vitamin C", manufacturer: "Abbott", category: "Vitamins & Supplements", dosage: "500mg", form: "Chewable Tablet", packSize: "Strip of 15", price: 28, mrp: 35, stock: 140, requiresPrescription: false, isScheduleH: false },
  { name: "Neurobion Forte", genericName: "Vitamin B1 B6 B12", manufacturer: "Merck", category: "Vitamins & Supplements", dosage: "", form: "Tablet", packSize: "Strip of 30", price: 55, mrp: 68, stock: 95, requiresPrescription: false, isScheduleH: false },
  { name: "Folic Acid 5mg", genericName: "Folic Acid", manufacturer: "Mankind", category: "Vitamins & Supplements", dosage: "5mg", form: "Tablet", packSize: "Strip of 30", price: 18, mrp: 25, stock: 110, requiresPrescription: false, isScheduleH: false },
  
  // Digestive Health
  { name: "Digene Tablet", genericName: "Antacid", manufacturer: "Abbott", category: "Digestive Health", dosage: "", form: "Chewable Tablet", packSize: "Strip of 15", price: 42, mrp: 52, stock: 130, requiresPrescription: false, isScheduleH: false },
  { name: "Gelusil MPS", genericName: "Antacid", manufacturer: "Pfizer", category: "Digestive Health", dosage: "", form: "Tablet", packSize: "Strip of 20", price: 55, mrp: 68, stock: 100, requiresPrescription: false, isScheduleH: false },
  { name: "Pan 40", genericName: "Pantoprazole", manufacturer: "Alkem", category: "Digestive Health", dosage: "40mg", form: "Tablet", packSize: "Strip of 15", price: 95, mrp: 120, stock: 85, requiresPrescription: false, isScheduleH: false },
  { name: "Pantocid 40", genericName: "Pantoprazole", manufacturer: "Sun Pharma", category: "Digestive Health", dosage: "40mg", form: "Tablet", packSize: "Strip of 15", price: 110, mrp: 135, stock: 75, requiresPrescription: false, isScheduleH: false },
  { name: "Omez 20", genericName: "Omeprazole", manufacturer: "Dr. Reddy's", category: "Digestive Health", dosage: "20mg", form: "Capsule", packSize: "Strip of 15", price: 85, mrp: 105, stock: 90, requiresPrescription: false, isScheduleH: false },
  { name: "Rantac 150", genericName: "Ranitidine", manufacturer: "JB Chemicals", category: "Digestive Health", dosage: "150mg", form: "Tablet", packSize: "Strip of 30", price: 45, mrp: 58, stock: 70, requiresPrescription: false, isScheduleH: false },
  { name: "Econorm Sachet", genericName: "Saccharomyces boulardii", manufacturer: "Dr. Reddy's", category: "Digestive Health", dosage: "250mg", form: "Sachet", packSize: "Box of 10", price: 195, mrp: 235, stock: 60, requiresPrescription: false, isScheduleH: false },
  { name: "Eldoper Capsule", genericName: "Loperamide", manufacturer: "Elder", category: "Digestive Health", dosage: "2mg", form: "Capsule", packSize: "Strip of 4", price: 28, mrp: 35, stock: 80, requiresPrescription: false, isScheduleH: false },
  { name: "Cremaffin Syrup", genericName: "Liquid Paraffin + Milk of Magnesia", manufacturer: "Abbott", category: "Digestive Health", dosage: "", form: "Syrup", packSize: "225ml", price: 145, mrp: 175, stock: 55, requiresPrescription: false, isScheduleH: false },
  { name: "Dulcolax Tablet", genericName: "Bisacodyl", manufacturer: "Sanofi", category: "Digestive Health", dosage: "5mg", form: "Tablet", packSize: "Strip of 10", price: 32, mrp: 42, stock: 65, requiresPrescription: false, isScheduleH: false },
  
  // Cold & Flu
  { name: "Sinarest", genericName: "Paracetamol + Phenylephrine + CPM", manufacturer: "Centaur", category: "Cold & Flu", dosage: "", form: "Tablet", packSize: "Strip of 10", price: 35, mrp: 45, stock: 120, requiresPrescription: false, isScheduleH: false },
  { name: "Vicks Action 500", genericName: "Paracetamol + Phenylephrine + Caffeine", manufacturer: "P&G", category: "Cold & Flu", dosage: "", form: "Tablet", packSize: "Strip of 10", price: 42, mrp: 52, stock: 100, requiresPrescription: false, isScheduleH: false },
  { name: "Calpol T", genericName: "Paracetamol + Tramadol", manufacturer: "GSK", category: "Cold & Flu", dosage: "500mg+37.5mg", form: "Tablet", packSize: "Strip of 10", price: 85, mrp: 105, stock: 60, requiresPrescription: true, isScheduleH: true },
  { name: "Chericof Syrup", genericName: "Dextromethorphan + CPM", manufacturer: "Sun Pharma", category: "Cold & Flu", dosage: "", form: "Syrup", packSize: "100ml", price: 75, mrp: 95, stock: 80, requiresPrescription: false, isScheduleH: false },
  { name: "Benadryl Syrup", genericName: "Diphenhydramine", manufacturer: "Johnson & Johnson", category: "Cold & Flu", dosage: "", form: "Syrup", packSize: "100ml", price: 85, mrp: 105, stock: 70, requiresPrescription: false, isScheduleH: false },
  { name: "Allegra 120", genericName: "Fexofenadine", manufacturer: "Sanofi", category: "Cold & Flu", dosage: "120mg", form: "Tablet", packSize: "Strip of 10", price: 145, mrp: 175, stock: 55, requiresPrescription: false, isScheduleH: false },
  { name: "Cetirizine 10", genericName: "Cetirizine", manufacturer: "Cipla", category: "Cold & Flu", dosage: "10mg", form: "Tablet", packSize: "Strip of 10", price: 25, mrp: 35, stock: 150, requiresPrescription: false, isScheduleH: false },
  { name: "Montair LC", genericName: "Montelukast + Levocetirizine", manufacturer: "Cipla", category: "Cold & Flu", dosage: "10mg+5mg", form: "Tablet", packSize: "Strip of 10", price: 165, mrp: 195, stock: 65, requiresPrescription: false, isScheduleH: false },
  { name: "Otrivin Nasal Drops", genericName: "Xylometazoline", manufacturer: "GSK", category: "Cold & Flu", dosage: "0.1%", form: "Nasal Drops", packSize: "10ml", price: 65, mrp: 80, stock: 90, requiresPrescription: false, isScheduleH: false },
  { name: "Nasivion Nasal Drops", genericName: "Oxymetazoline", manufacturer: "Merck", category: "Cold & Flu", dosage: "0.05%", form: "Nasal Drops", packSize: "10ml", price: 75, mrp: 92, stock: 85, requiresPrescription: false, isScheduleH: false },
  
  // Diabetes Care
  { name: "Metformin 500", genericName: "Metformin", manufacturer: "USV", category: "Diabetes Care", dosage: "500mg", form: "Tablet", packSize: "Strip of 20", price: 35, mrp: 48, stock: 100, requiresPrescription: true, isScheduleH: false },
  { name: "Glycomet 500", genericName: "Metformin", manufacturer: "USV", category: "Diabetes Care", dosage: "500mg", form: "Tablet", packSize: "Strip of 20", price: 38, mrp: 52, stock: 90, requiresPrescription: true, isScheduleH: false },
  { name: "Glimepiride 2", genericName: "Glimepiride", manufacturer: "Sun Pharma", category: "Diabetes Care", dosage: "2mg", form: "Tablet", packSize: "Strip of 10", price: 55, mrp: 72, stock: 70, requiresPrescription: true, isScheduleH: false },
  { name: "Januvia 100", genericName: "Sitagliptin", manufacturer: "MSD", category: "Diabetes Care", dosage: "100mg", form: "Tablet", packSize: "Strip of 7", price: 385, mrp: 450, stock: 40, requiresPrescription: true, isScheduleH: false },
  { name: "Glucobay 50", genericName: "Acarbose", manufacturer: "Bayer", category: "Diabetes Care", dosage: "50mg", form: "Tablet", packSize: "Strip of 20", price: 145, mrp: 175, stock: 50, requiresPrescription: true, isScheduleH: false },
  
  // Heart Health
  { name: "Ecosprin 75", genericName: "Aspirin", manufacturer: "USV", category: "Heart Health", dosage: "75mg", form: "Tablet", packSize: "Strip of 14", price: 12, mrp: 18, stock: 150, requiresPrescription: false, isScheduleH: false },
  { name: "Ecosprin AV 75/10", genericName: "Aspirin + Atorvastatin", manufacturer: "USV", category: "Heart Health", dosage: "75mg+10mg", form: "Capsule", packSize: "Strip of 15", price: 145, mrp: 175, stock: 60, requiresPrescription: true, isScheduleH: false },
  { name: "Atorvastatin 10", genericName: "Atorvastatin", manufacturer: "Ranbaxy", category: "Heart Health", dosage: "10mg", form: "Tablet", packSize: "Strip of 10", price: 85, mrp: 105, stock: 80, requiresPrescription: true, isScheduleH: false },
  { name: "Clopidogrel 75", genericName: "Clopidogrel", manufacturer: "Sun Pharma", category: "Heart Health", dosage: "75mg", form: "Tablet", packSize: "Strip of 10", price: 95, mrp: 120, stock: 55, requiresPrescription: true, isScheduleH: false },
  { name: "Amlodipine 5", genericName: "Amlodipine", manufacturer: "Pfizer", category: "Heart Health", dosage: "5mg", form: "Tablet", packSize: "Strip of 14", price: 65, mrp: 85, stock: 100, requiresPrescription: true, isScheduleH: false },
  
  // Skin Care
  { name: "Betadine Ointment", genericName: "Povidone Iodine", manufacturer: "Win-Medicare", category: "Skin Care", dosage: "5%", form: "Ointment", packSize: "15g", price: 45, mrp: 58, stock: 80, requiresPrescription: false, isScheduleH: false },
  { name: "Candid Cream", genericName: "Clotrimazole", manufacturer: "Glenmark", category: "Skin Care", dosage: "1%", form: "Cream", packSize: "15g", price: 65, mrp: 82, stock: 70, requiresPrescription: false, isScheduleH: false },
  { name: "Soframycin Cream", genericName: "Framycetin", manufacturer: "Sanofi", category: "Skin Care", dosage: "1%", form: "Cream", packSize: "30g", price: 75, mrp: 95, stock: 65, requiresPrescription: false, isScheduleH: false },
  { name: "Clobetasol Cream", genericName: "Clobetasol", manufacturer: "Glenmark", category: "Skin Care", dosage: "0.05%", form: "Cream", packSize: "15g", price: 85, mrp: 105, stock: 50, requiresPrescription: true, isScheduleH: false },
  { name: "Moisturex Cream", genericName: "Urea", manufacturer: "Ranbaxy", category: "Skin Care", dosage: "10%", form: "Cream", packSize: "100g", price: 155, mrp: 185, stock: 45, requiresPrescription: false, isScheduleH: false },
  
  // Eye Care
  { name: "Genteal Eye Drops", genericName: "Hydroxypropyl Methylcellulose", manufacturer: "Alcon", category: "Eye Care", dosage: "0.3%", form: "Eye Drops", packSize: "10ml", price: 175, mrp: 210, stock: 40, requiresPrescription: false, isScheduleH: false },
  { name: "Refresh Tears", genericName: "Carboxymethylcellulose", manufacturer: "Allergan", category: "Eye Care", dosage: "0.5%", form: "Eye Drops", packSize: "10ml", price: 195, mrp: 235, stock: 35, requiresPrescription: false, isScheduleH: false },
  { name: "Moxifloxacin Eye Drops", genericName: "Moxifloxacin", manufacturer: "Cipla", category: "Eye Care", dosage: "0.5%", form: "Eye Drops", packSize: "5ml", price: 85, mrp: 105, stock: 60, requiresPrescription: true, isScheduleH: true },
  { name: "Tobramycin Eye Drops", genericName: "Tobramycin", manufacturer: "Sun Pharma", category: "Eye Care", dosage: "0.3%", form: "Eye Drops", packSize: "5ml", price: 75, mrp: 95, stock: 55, requiresPrescription: true, isScheduleH: true },
  
  // First Aid
  { name: "Band-Aid Flexible", genericName: "Adhesive Bandage", manufacturer: "Johnson & Johnson", category: "First Aid", dosage: "", form: "Bandage", packSize: "Box of 30", price: 85, mrp: 105, stock: 100, requiresPrescription: false, isScheduleH: false },
  { name: "Dettol Antiseptic", genericName: "Chloroxylenol", manufacturer: "Reckitt", category: "First Aid", dosage: "4.8%", form: "Liquid", packSize: "125ml", price: 65, mrp: 80, stock: 90, requiresPrescription: false, isScheduleH: false },
  { name: "Burnol Cream", genericName: "Aminacrine + Cetrimide", manufacturer: "Dr. Morepen", category: "First Aid", dosage: "", form: "Cream", packSize: "20g", price: 45, mrp: 58, stock: 75, requiresPrescription: false, isScheduleH: false },
  { name: "Cotton Wool", genericName: "Absorbent Cotton", manufacturer: "Various", category: "First Aid", dosage: "", form: "Cotton", packSize: "100g", price: 55, mrp: 70, stock: 120, requiresPrescription: false, isScheduleH: false },
  { name: "Crepe Bandage", genericName: "Elastic Bandage", manufacturer: "Various", category: "First Aid", dosage: "", form: "Bandage", packSize: "6cm x 4m", price: 35, mrp: 45, stock: 80, requiresPrescription: false, isScheduleH: false },
];

export async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // Check if already seeded
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length > 0) {
      console.log("Database already seeded");
      return;
    }

    // Insert categories
    const categoryMap = new Map<string, string>();
    for (const cat of medicineCategories) {
      const [inserted] = await db.insert(categories).values(cat).returning();
      categoryMap.set(cat.name, inserted.id);
    }
    console.log(`Inserted ${medicineCategories.length} categories`);

    // Insert medicines
    for (const med of medicineData) {
      const categoryId = categoryMap.get(med.category);
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
