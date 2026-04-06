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
  annualPayment: varchar("annualPayment", { length: 64 }).notNull().default(""),
  price: varchar("price", { length: 64 }).notNull(),
  paymentYears: int("paymentYears"),
  paymentDownPct: int("paymentDownPct"),
  finishing: varchar("finishing", { length: 64 }).notNull().default("Semi Finished"),
  delivery: varchar("delivery", { length: 64 }).notNull().default(""),
  // Visibility controls
  showPrice: int("showPrice").notNull().default(1),
  showDownpayment: int("showDownpayment").notNull().default(1),
  showMonthly: int("showMonthly").notNull().default(1),
  showFullPrice: int("showFullPrice").notNull().default(1),
  showCompound: int("showCompound").notNull().default(1),
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

// Type helpers for visibility settings
export interface ListingVisibility {
  showPrice: boolean;
  showDownpayment: boolean;
  showMonthly: boolean;
  showFullPrice: boolean;
  showCompound: boolean;
}

/**
 * Locations table for 5-level hierarchical location taxonomy.
 * Levels: 1=Governorate, 2=City, 3=District, 4=Sub-area, 5=Compound
 */
export const locations = mysqlTable("locations", {
  id: int("id").autoincrement().primaryKey(),
  nameAr: varchar("nameAr", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  level: int("level").notNull(), // 1-5
  parentId: int("parentId"),
  listingCount: int("listingCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;
