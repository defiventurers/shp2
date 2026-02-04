import { Router } from "express";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import { db } from "../db";
import { medicines } from "@shared/schema";

const router = Router();

/**
 * ADMIN INVENTORY IMPORT
 * CSV schema (exact):
 * 1) name
 * 2) price
 * 3) requiresPrescription
 * 4) quantity
 * 5) manufacturer
 * 6) imageUrl
 */

router.post("/import-inventory", async (_req, res) => {
  console.log("🚨 ADMIN INVENTORY IMPORT TRIGGERED");

  const csvPath = path.join(
    process.cwd(),
    "server",
    "data",
    "easyload_inventory.csv"
  );

  if (!fs.existsSync(csvPath)) {
    console.error("❌ CSV NOT FOUND:", csvPath);
    return res.status(500).json({ error: "CSV not found" });
  }

  console.log("📥 Using CSV:", csvPath);

  try {
    // 🔥 HARD RESET (delete old inventory)
    await db.delete(medicines);
    console.log("🧨 Medicines table cleared");

    const rows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    let inserted = 0;

    for (const row of rows) {
      await db.insert(medicines).values({
        name: row["Medicine Name"],
        price: row["Price"],
        mrp: row["Price"],
        stock: Number(row["Quantity"] || 0),
        manufacturer: row["Manufacturer"] || null,
        imageUrl: row["Image URL"] || null,
        requiresPrescription:
          String(row["Is Prescription Required?"]).toLowerCase() === "true",
        isScheduleH:
          String(row["Is Prescription Required?"]).toLowerCase() === "true",
      });

      inserted++;

      if (inserted % 500 === 0) {
        console.log(`➕ Inserted ${inserted} medicines`);
      }
    }

    console.log(`✅ IMPORT COMPLETE: ${inserted} medicines`);

    res.json({
      success: true,
      inserted,
    });
  } catch (err) {
    console.error("❌ IMPORT FAILED:", err);
    res.status(500).json({ error: "Import failed" });
  }
});

export default router;