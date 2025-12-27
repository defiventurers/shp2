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
   Users
========================= */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   Prescriptions (MULTI PAGE)
========================= */
export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),

  // ✅ MULTI IMAGE SUPPORT (SAFE)
  imageUrls: jsonb("image_urls")
    .notNull()
    .default(sql`'[]'::jsonb`),

  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   Relations
========================= */
export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
}));

/* =========================
   Types
========================= */
export type Prescription = {
  id: string;
  userId: string;
  imageUrls: string[];
  status: string | null;
  createdAt: Date | null;
};