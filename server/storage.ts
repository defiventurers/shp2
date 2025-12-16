import {
  users,
  categories,
  medicines,
  prescriptions,
  orders,
  orderItems,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Medicine,
  type InsertMedicine,
  type Prescription,
  type InsertPrescription,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, or, and, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Medicine operations
  getMedicines(): Promise<Medicine[]>;
  getMedicine(id: string): Promise<Medicine | undefined>;
  getMedicineByName(name: string): Promise<Medicine | undefined>;
  searchMedicines(query: string): Promise<Medicine[]>;
  getLowStockMedicines(threshold: number): Promise<Medicine[]>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: string, updates: Partial<InsertMedicine>): Promise<Medicine | undefined>;
  
  // Prescription operations
  getPrescriptions(userId: string): Promise<Prescription[]>;
  getPrescription(id: string): Promise<Prescription | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, updates: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  
  // Order operations
  getOrders(userId?: string): Promise<(Order & { items: OrderItem[] })[]>;
  getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  getOrderByNumber(orderNumber: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Admin operations
  getAllOrders(): Promise<(Order & { items: OrderItem[] })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  // Medicine operations
  async getMedicines(): Promise<Medicine[]> {
    return db.select().from(medicines).orderBy(medicines.name);
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(eq(medicines.id, id));
    return medicine;
  }

  async getMedicineByName(name: string): Promise<Medicine | undefined> {
    const [medicine] = await db.select().from(medicines).where(
      sql`LOWER(${medicines.name}) = LOWER(${name})`
    );
    return medicine;
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(medicines).where(
      or(
        like(medicines.name, searchPattern),
        like(medicines.genericName, searchPattern),
        like(medicines.manufacturer, searchPattern)
      )
    ).orderBy(medicines.name);
  }

  async getLowStockMedicines(threshold: number): Promise<Medicine[]> {
    return db.select().from(medicines).where(lte(medicines.stock, threshold)).orderBy(medicines.stock);
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const [created] = await db.insert(medicines).values(medicine).returning();
    return created;
  }

  async updateMedicine(id: string, updates: Partial<InsertMedicine>): Promise<Medicine | undefined> {
    const [updated] = await db
      .update(medicines)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(medicines.id, id))
      .returning();
    return updated;
  }

  // Prescription operations
  async getPrescriptions(userId: string): Promise<Prescription[]> {
    return db.select().from(prescriptions).where(eq(prescriptions.userId, userId)).orderBy(desc(prescriptions.createdAt));
  }

  async getPrescription(id: string): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription;
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const [created] = await db.insert(prescriptions).values(prescription).returning();
    return created;
  }

  async updatePrescription(id: string, updates: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [updated] = await db.update(prescriptions).set(updates).where(eq(prescriptions.id, id)).returning();
    return updated;
  }

  // Order operations
  async getOrders(userId?: string): Promise<(Order & { items: OrderItem[] })[]> {
    const ordersResult = userId 
      ? await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt))
      : await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      })
    );
    
    return ordersWithItems;
  }

  async getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return { ...order, items };
  }

  async getOrderByNumber(orderNumber: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    if (!order) return undefined;
    
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    return { ...order, items };
  }

  async createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<Order> {
    const [createdOrder] = await db.insert(orders).values(order).returning();
    
    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map((item) => ({
          ...item,
          orderId: createdOrder.id,
        }))
      );
    }
    
    // Decrease stock for each item
    for (const item of items) {
      await db.update(medicines)
        .set({ 
          stock: sql`${medicines.stock} - ${item.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(medicines.id, item.medicineId));
    }
    
    return createdOrder;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ ...updates, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Admin operations
  async getAllOrders(): Promise<(Order & { items: OrderItem[] })[]> {
    return this.getOrders();
  }
}

export const storage = new DatabaseStorage();
