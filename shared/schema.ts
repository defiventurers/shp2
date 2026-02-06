import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =========================
   Sessions
========================= */
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (t) => [index("IDX_session_expire").on(t.expire)],
);

/* =========================
   Users
========================= */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   Categories
========================= */
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
});

/* =========================
   Medicines
========================= */
export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  manufacturer: varchar("manufacturer"),
  categoryId: varchar("category_id").references(() => categories.id),
  packSize: integer("pack_size"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
  requiresPrescription: boolean("requires_prescription").default(false),
  imageUrl: varchar("image_url"),
  sourceFile: varchar("source_file"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   Prescriptions
========================= */
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  imageUrls: jsonb("image_urls").$type<string[]>(),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   Orders  ✅ FIXED
========================= */
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  orderNumber: varchar("order_number").notNull(),

  userId: varchar("user_id").references(() => users.id),

  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  customerEmail: varchar("customer_email"),

  deliveryType: varchar("delivery_type").notNull(),
  deliveryAddress: varchar("delivery_address"),

  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  status: varchar("status").notNull().default("pending"),
  prescriptionId: varchar("prescription_id"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   Order Items
========================= */
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  medicineId: varchar("medicine_id").references(() => medicines.id),
  medicineName: varchar("medicine_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

/* =========================
   Relations
========================= */
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  medicines: many(medicines),
}));

export const medicinesRelations = relations(medicines, ({ one }) => ({
  category: one(categories, {
    fields: [medicines.categoryId],
    references: [categories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

/* =========================
   Types
========================= */
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type Order = typeof orders.$inferSelect;