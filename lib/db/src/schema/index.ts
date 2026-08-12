import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const appUsersTable = pgTable(
  "app_users",
  {
    id: serial("id").primaryKey(),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 }).notNull().default("customer"),
    name: varchar("name", { length: 160 }).notNull().default("BobTech customer"),
    email: varchar("email", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ clerkUserIdIndex: uniqueIndex("app_users_clerk_user_id_idx").on(table.clerkUserId) }),
);

export const providersTable = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  state: varchar("state", { length: 80 }).notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
  portfolio: text("portfolio").array().notNull().default([]),
  styles: text("styles").array().notNull().default([]),
  verified: boolean("verified").notNull().default(true),
  rating: integer("rating").notNull().default(48),
  completedProjects: integer("completed_projects").notNull().default(0),
  startingPrice: integer("starting_price").notNull().default(0),
  responseTime: varchar("response_time", { length: 80 }).notNull().default("Within 1 day"),
});

export const marketplaceItemsTable = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 20 }).notNull().default("product"),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  maker: varchar("maker", { length: 160 }).notNull().default("BobTech Furnitures"),
  availability: varchar("availability", { length: 80 }).notNull().default("Made to order"),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => appUsersTable.id),
  name: varchar("name", { length: 180 }).notNull(),
  roomType: varchar("room_type", { length: 100 }).notNull(),
  style: varchar("style", { length: 100 }).notNull(),
  city: varchar("city", { length: 80 }).notNull(),
  budget: varchar("budget", { length: 80 }).notNull(),
  notes: text("notes").notNull().default(""),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 40 }).notNull().default("Brief received"),
  progress: integer("progress").notNull().default(10),
  providerName: varchar("provider_name", { length: 160 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 40 }).notNull(),
  userId: integer("user_id").notNull().references(() => appUsersTable.id),
  total: integer("total").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("Order received"),
  deliveryAddress: text("delivery_address").notNull().default("To be confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  itemId: integer("item_id").notNull().references(() => marketplaceItemsTable.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  itemName: varchar("item_name", { length: 180 }).notNull(),
});

export const aiDesignsTable = pgTable("ai_designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => appUsersTable.id),
  roomType: varchar("room_type", { length: 100 }).notNull(),
  style: varchar("style", { length: 100 }).notNull(),
  color: varchar("color", { length: 100 }).notNull(),
  budget: varchar("budget", { length: 80 }).notNull(),
  originalImage: text("original_image").notNull(),
  resultImage: text("result_image"),
  summary: text("summary").notNull(),
  recommendations: jsonb("recommendations").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItemsTable).omit({
  id: true,
  createdAt: true,
});
export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export const insertOrderSchema = z.object({
  items: z.array(z.object({ itemId: z.number().int().positive(), quantity: z.number().int().min(1).max(99) })).min(1),
  deliveryAddress: z.string().trim().min(5).max(500).optional(),
});

export type AppUser = typeof appUsersTable.$inferSelect;
export type Provider = typeof providersTable.$inferSelect;
export type MarketplaceItem = typeof marketplaceItemsTable.$inferSelect;
export type Project = typeof projectsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;