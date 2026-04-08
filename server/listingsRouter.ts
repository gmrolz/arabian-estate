import { eq, like, and, or, asc, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { listings } from "../drizzle/schema";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";

// ─── Input Schemas ───

const listingsFilterSchema = z.object({
  areaSlug: z.string().optional(),
  locationId: z.number().int().optional(),
  locationIds: z.array(z.number().int()).optional(),
  compoundName: z.string().optional(),
  developer: z.string().optional(),
  finishing: z.string().optional(),
  rooms: z.number().optional(),
  delivery: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional().default(true),
});

const createListingSchema = z.object({
  unitCode: z.string().default(""),
  titleAr: z.string().default(""),
  titleEn: z.string().default(""),
  developer: z.string().optional().default(""),
  developerAr: z.string().optional().default(""),
  developerEn: z.string().optional().default(""),
  project: z.string().optional().default(""),
  projectAr: z.string().optional().default(""),
  projectEn: z.string().optional().default(""),
  location: z.string().default(""),
  locationId: z.number().int().nullable().optional(),
  compoundName: z.string().optional().default(""),
  unitType: z.string().default("Apartment"),
  area: z.number().int().default(0),
  rooms: z.number().int().default(0),
  toilets: z.number().int().default(0),
  downpayment: z.string().default("0"),
  monthlyInst: z.string().default(""),
  price: z.string().default(""),
  finishing: z.string().default("Semi Finished"),
  delivery: z.string().default(""),
  paymentYears: z.number().int().nullable().optional(),
  paymentDownPct: z.number().int().nullable().optional(),
  annualPayment: z.string().optional().default(""),
  showPrice: z.boolean().optional().default(true),
  showDownpayment: z.boolean().optional().default(true),
  showMonthly: z.boolean().optional().default(true),
  showFullPrice: z.boolean().optional().default(false),
  showAnnual: z.boolean().optional().default(false),
  showCompound: z.boolean().optional().default(true),
  featured: z.boolean().default(false),
  areaSlug: z.string().default("new-capital"),
  mapsUrl: z.string().optional().default(""),
  images: z.union([z.string(), z.array(z.string())]).optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

const updateListingSchema = z.object({
  id: z.number().int().positive(),
  unitCode: z.string().optional(),
  titleAr: z.string().optional(),
  titleEn: z.string().optional(),
  developer: z.string().optional(),
  developerAr: z.string().optional(),
  developerEn: z.string().optional(),
  project: z.string().optional(),
  projectAr: z.string().optional(),
  projectEn: z.string().optional(),
  location: z.string().optional(),
  locationId: z.number().int().nullable().optional(),
  compoundName: z.string().optional(),
  unitType: z.string().optional(),
  area: z.number().int().optional(),
  rooms: z.number().int().optional(),
  toilets: z.number().int().optional(),
  downpayment: z.string().optional(),
  monthlyInst: z.string().optional(),
  price: z.string().optional(),
  finishing: z.string().optional(),
  delivery: z.string().optional(),
  paymentYears: z.number().int().nullable().optional(),
  paymentDownPct: z.number().int().nullable().optional(),
  annualPayment: z.string().optional(),
  showPrice: z.boolean().optional(),
  showDownpayment: z.boolean().optional(),
  showMonthly: z.boolean().optional(),
  showFullPrice: z.boolean().optional(),
  showAnnual: z.boolean().optional(),
  showCompound: z.boolean().optional(),
  featured: z.boolean().optional(),
  areaSlug: z.string().optional(),
  mapsUrl: z.string().optional(),
  images: z.union([z.string(), z.array(z.string())]).optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

function parseImages(row: { images: string | null }): string[] {
  if (!row.images) return [];
  try {
    return JSON.parse(row.images);
  } catch {
    return [];
  }
}

function serializeImages(images: string | string[] | undefined | null): string | null {
  if (!images) return null;
  if (typeof images === "string") return images; // already JSON string
  return JSON.stringify(images);
}

function formatRow(row: any) {
  return {
    ...row,
    featured: row.featured === 1,
    active: row.active === 1,
    showPrice: row.showPrice === 1,
    showDownpayment: row.showDownpayment === 1,
    showMonthly: row.showMonthly === 1,
    showFullPrice: row.showFullPrice === 1,
    showAnnual: row.showAnnual === 1,
    showCompound: row.showCompound === 1,
    images: parseImages(row),
  };
}

// ─── Router ───
export const listingsRouter = router({
  // Public: Get all active listings with optional filters
  list: publicProcedure
    .input(listingsFilterSchema.optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const filters = input ?? { active: true as const };
      const conditions = [];

      if (filters.active !== false) {
        conditions.push(eq(listings.active, 1));
      }
      if (filters.areaSlug) {
        conditions.push(eq(listings.areaSlug, filters.areaSlug));
      }
      if (filters.locationId) {
        conditions.push(eq(listings.locationId, filters.locationId));
      }
      if (filters.locationIds && filters.locationIds.length > 0) {
        conditions.push(inArray(listings.locationId, filters.locationIds));
      }
      if (filters.compoundName) {
        conditions.push(eq(listings.compoundName, filters.compoundName));
      }
      if (filters.developer) {
        conditions.push(eq(listings.developer, filters.developer));
      }
      if (filters.finishing) {
        conditions.push(eq(listings.finishing, filters.finishing));
      }
      if (filters.rooms) {
        conditions.push(eq(listings.rooms, filters.rooms));
      }
      if (filters.delivery) {
        if (filters.delivery === "ready") {
          conditions.push(eq(listings.delivery, "Ready to Move"));
        } else if (filters.delivery === "offplan") {
          conditions.push(sql`${listings.delivery} != 'Ready to Move'`);
        }
      }
      if (filters.featured) {
        conditions.push(eq(listings.featured, 1));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select()
        .from(listings)
        .where(where)
        .orderBy(asc(listings.sortOrder), desc(listings.id));

      return rows.map(formatRow);
    }),

  // Public: Get a single listing by ID
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const rows = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.id))
        .limit(1);

      if (rows.length === 0) return null;
      return formatRow(rows[0]);
    }),

  // Public: Get filter options
  filterOptions: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { developers: [], finishings: [], rooms: [], areaSlugs: [] };

    const rows = await db
      .select()
      .from(listings)
      .where(eq(listings.active, 1));

    const developers = Array.from(new Set(rows.map((r) => r.developer).filter(Boolean))).sort();
    const finishings = Array.from(new Set(rows.map((r) => r.finishing).filter(Boolean))).sort();
    const rooms = Array.from(new Set(rows.map((r) => r.rooms))).sort((a, b) => a - b);
    const areaSlugs = Array.from(new Set(rows.map((r) => r.areaSlug))).sort();

    return { developers, finishings, rooms, areaSlugs };
  }),

  // Create a new listing (admin panel has its own password auth)
  create: publicProcedure
    .input(createListingSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(listings).values({
        unitCode: input.unitCode,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        developer: input.developer || input.developerEn || input.developerAr || "",
        developerAr: input.developerAr || input.developer || "",
        developerEn: input.developerEn || input.developer || "",
        project: input.project || input.projectEn || input.projectAr || "",
        projectAr: input.projectAr || input.project || "",
        projectEn: input.projectEn || input.project || "",
        location: input.location,
        locationId: input.locationId ?? null,
        compoundName: input.compoundName ?? "",
        unitType: input.unitType,
        area: input.area,
        rooms: input.rooms,
        toilets: input.toilets,
        downpayment: input.downpayment,
        monthlyInst: input.monthlyInst,
        price: input.price,
        finishing: input.finishing,
        delivery: input.delivery,
        paymentYears: input.paymentYears ?? null,
        paymentDownPct: input.paymentDownPct ?? null,
        annualPayment: input.annualPayment ?? "",
        showPrice: input.showPrice !== false ? 1 : 0,
        showDownpayment: input.showDownpayment !== false ? 1 : 0,
        showMonthly: input.showMonthly !== false ? 1 : 0,
        showFullPrice: input.showFullPrice ? 1 : 0,
        showAnnual: input.showAnnual ? 1 : 0,
        showCompound: input.showCompound !== false ? 1 : 0,
        featured: input.featured ? 1 : 0,
        active: input.active ? 1 : 0,
        areaSlug: input.areaSlug,
        mapsUrl: input.mapsUrl ?? "",
        images: serializeImages(input.images),
        sortOrder: input.sortOrder,
      });
      return { id: Number(result[0].insertId), success: true };
    }),

  // Update an existing listing
  update: publicProcedure
    .input(updateListingSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        if (key === "featured" || key === "active" || key === "showPrice" || key === "showDownpayment" || key === "showMonthly" || key === "showFullPrice" || key === "showAnnual" || key === "showCompound") {
          updateData[key] = value ? 1 : 0;
        } else if (key === "images") {
          updateData[key] = serializeImages(value as string | string[]);
        } else {
          updateData[key] = value;
        }
      }

      // Keep developer/project in sync with bilingual fields
      if (updateData.developerAr || updateData.developerEn) {
        updateData.developer = (updateData.developerEn || updateData.developerAr || "") as string;
      }
      if (updateData.projectAr || updateData.projectEn) {
        updateData.project = (updateData.projectEn || updateData.projectAr || "") as string;
      }

      if (Object.keys(updateData).length === 0) {
        return { id, success: true };
      }

      await db.update(listings).set(updateData).where(eq(listings.id, id));
      return { id, success: true };
    }),

  // Delete a listing
  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(listings).where(eq(listings.id, input.id));
      return { success: true };
    }),

  // Admin: Reorder listings
  reorder: publicProcedure
    .input(z.object({ orderedIds: z.array(z.number().int().positive()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates = input.orderedIds.map((listingId, i) =>
        db.update(listings).set({ sortOrder: i }).where(eq(listings.id, listingId))
      );
      await Promise.all(updates);
      return { success: true };
    }),

  // Admin: Get all listings including inactive (for admin panel)
  adminList: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(listings)
      .orderBy(asc(listings.sortOrder), desc(listings.id));

    return rows.map(formatRow);
  }),
});
