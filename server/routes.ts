import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, optionalAuth } from "./replitAuth";
import multer from "multer";
import { randomBytes } from "crypto";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(2).toString('hex').toUpperCase();
  return `SH${timestamp}${random}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Medicines
  app.get('/api/medicines', async (req, res) => {
    try {
      const { search } = req.query;
      const medicines = search 
        ? await storage.searchMedicines(search as string)
        : await storage.getMedicines();
      res.json(medicines);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  });

  app.get('/api/medicines/:id', async (req, res) => {
    try {
      const medicine = await storage.getMedicine(req.params.id);
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      res.json(medicine);
    } catch (error) {
      console.error("Error fetching medicine:", error);
      res.status(500).json({ message: "Failed to fetch medicine" });
    }
  });

  // Prescriptions
  app.get('/api/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prescriptions = await storage.getPrescriptions(userId);
      res.json(prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.post('/api/prescriptions/upload', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      // Store image as base64 for simplicity (in production, use proper object storage)
      const imageData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      // Simple OCR simulation - in production, use OCR.space API or similar
      // For demo purposes, we'll extract some common medicine names
      const extractedMedicines = await extractMedicinesFromImage(imageData);
      
      const prescription = await storage.createPrescription({
        userId,
        imageUrl: imageData,
        ocrText: extractedMedicines.map(m => m.name).join(', '),
        extractedMedicines: extractedMedicines,
        status: "pending",
      });
      
      res.json({
        ...prescription,
        extractedMedicines,
      });
    } catch (error) {
      console.error("Error uploading prescription:", error);
      res.status(500).json({ message: "Failed to upload prescription" });
    }
  });

  // Orders
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', optionalAuth, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const { 
        customerName, 
        customerPhone, 
        customerEmail,
        deliveryType, 
        deliveryAddress,
        prescriptionId,
        notes,
        items,
        subtotal,
        deliveryFee,
        total 
      } = req.body;

      if (!customerName || !customerPhone || !deliveryType || !items || items.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate stock availability
      for (const item of items) {
        const medicine = await storage.getMedicine(item.medicineId);
        if (!medicine) {
          return res.status(400).json({ message: `Medicine not found: ${item.medicineId}` });
        }
        if (medicine.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${medicine.name}` });
        }
      }

      const orderNumber = generateOrderNumber();
      
      const order = await storage.createOrder(
        {
          orderNumber,
          userId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          prescriptionId: prescriptionId || null,
          deliveryType,
          deliveryAddress: deliveryAddress || null,
          status: "pending",
          subtotal,
          deliveryFee,
          total,
          notes: notes || null,
        },
        items.map((item: any) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: item.quantity,
          price: item.price,
          total: (parseFloat(item.price) * item.quantity).toString(),
        }))
      );

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Admin routes
  app.get('/api/admin/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch('/api/admin/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { status } = req.body;
      const order = await storage.updateOrder(req.params.id, { status });
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.patch('/api/admin/medicines/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { stock, price } = req.body;
      const updates: any = {};
      
      if (stock !== undefined) updates.stock = stock;
      if (price !== undefined) updates.price = price;
      
      const medicine = await storage.updateMedicine(req.params.id, updates);
      
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      
      res.json(medicine);
    } catch (error) {
      console.error("Error updating medicine:", error);
      res.status(500).json({ message: "Failed to update medicine" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to simulate OCR extraction
async function extractMedicinesFromImage(imageData: string): Promise<{ name: string; dosage?: string; matched?: any }[]> {
  // In production, call OCR.space API or similar
  // For demo, return common medicines that might be in a prescription
  const commonMedicines = [
    { name: "Paracetamol", dosage: "500mg" },
    { name: "Azithromycin", dosage: "500mg" },
    { name: "Crocin", dosage: "650mg" },
  ];

  // Try to match with inventory
  const result = [];
  for (const med of commonMedicines) {
    const matched = await storage.getMedicineByName(med.name);
    result.push({
      name: med.name,
      dosage: med.dosage,
      matched: matched || undefined,
    });
  }

  return result.slice(0, 3); // Return first 3 for demo
}
