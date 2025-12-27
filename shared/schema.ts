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

/* =========================
   USERS
========================= */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  name: varchar("name"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   CATEGORIES
========================= */
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
});

/* =========================
   MEDICINES
========================= */
export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  requiresPrescription: boolean("requires_prescription").default(false),
  categoryId: varchar("category_id").references(() => categories.id),
});

/* =========================
   PRESCRIPTIONS (MULTI PAGE)
========================= */
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),

  // ✅ MULTI IMAGE SUPPORT
  imageUrls: jsonb("image_urls")
    .notNull()
    .default(sql`'[]'::jsonb`),

  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   ORDERS
========================= */
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   ORDER ITEMS
========================= */
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  medicineId: varchar("medicine_id").references(() => medicines.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

/* =========================
   RELATIONS
========================= */
export const usersRelations = relations(users, ({ many }) => ({
  prescriptions: many(prescriptions),
  orders: many(orders),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

/* =========================
   TYPES
========================= */
export type Prescription = {
  id: string;
  userId: string;
  imageUrls: string[];
  status: string | null;
  createdAt: Date | null;
};