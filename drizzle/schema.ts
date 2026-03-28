import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Listings table for real estate properties.
 * Supports bilingual (AR/EN) developer and project names.
 */
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  unitCode: varchar("unitCode", { length: 32 }).notNull(),
  titleAr: text("titleAr").notNull(),
  titleEn: text("titleEn").notNull(),
  // Bilingual developer & project
  developer: varchar("developer", { length: 128 }).notNull().default(""),
  developerAr: varchar("developerAr", { length: 128 }).notNull().default(""),
  developerEn: varchar("developerEn", { length: 128 }).notNull().default(""),
  project: varchar("project", { length: 128 }).notNull().default(""),
  projectAr: varchar("projectAr", { length: 128 }).notNull().default(""),
  projectEn: varchar("projectEn", { length: 128 }).notNull().default(""),
  location: varchar("location", { length: 256 }).notNull(),
  unitType: varchar("unitType", { length: 64 }).notNull().default("Apartment"),
  area: int("area").notNull(),
  rooms: int("rooms").notNull(),
  toilets: int("toilets").notNull(),
  downpayment: varchar("downpayment", { length: 64 }).notNull().default("0"),
  monthlyInst: varchar("monthlyInst", { length: 64 }).notNull().default(""),
  price: varchar("price", { length: 64 }).notNull(),
  finishing: varchar("finishing", { length: 64 }).notNull().default("Semi Finished"),
  delivery: varchar("delivery", { length: 64 }).notNull().default(""),
  featured: int("featured").notNull().default(0),
  areaSlug: varchar("areaSlug", { length: 64 }).notNull().default("new-capital"),
  images: text("images"), // JSON array of image URLs
  sortOrder: int("sortOrder").notNull().default(0),
  active: int("active").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;
