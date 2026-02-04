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
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  (table) => [index("IDX_session_expire").on(table.expire)],
);

/* =========================
   Users
========================= */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  address: text("address"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   Medicines (FINAL)
========================= */
export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  name: varchar("name").notNull(),
  manufacturer: varchar("manufacturer").notNull(),

  packSize: varchar("pack_size"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),

  requiresPrescription: boolean("requires_prescription").default(false),
  isScheduleH: boolean("is_schedule_h").default(false),

  imageUrl: varchar("image_url"),
  sourceFile: varchar("source_file").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   Prescriptions
========================= */
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  imageUrls: jsonb("image_urls").$type<string[]>().notNull(),
  ocrText: text("ocr_text"),
  extractedMedicines: jsonb("extracted_medicines"),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   Orders
========================= */
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(),

  userId: varchar("user_id").notNull().references(() => users.id),
  prescriptionId: varchar("prescription_id").references(() => prescriptions.id),

  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  customerEmail: varchar("customer_email"),

  deliveryType: varchar("delivery_type").notNull(),
  deliveryAddress: text("delivery_address"),

  status: varchar("status").default("pending"),

  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   Order Items
========================= */
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  medicineId: varchar("medicine_id").notNull().references(() => medicines.id),
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
  prescriptions: many(prescriptions),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  prescription: one(prescriptions, {
    fields: [orders.prescriptionId],
    references: [prescriptions.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  medicine: one(medicines, {
    fields: [orderItems.medicineId],
    references: [medicines.id],
  }),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
}));

/* =========================
   Insert Schemas
========================= */
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

/* =========================
   Types
========================= */
export type User = typeof users.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;