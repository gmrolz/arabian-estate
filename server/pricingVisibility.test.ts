import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test that the Zod schemas accept pricing visibility fields

const createListingSchema = z.object({
  unitCode: z.string().default(""),
  titleAr: z.string().default(""),
  titleEn: z.string().default(""),
  price: z.string().default(""),
  downpayment: z.string().default("0"),
  monthlyInst: z.string().default(""),
  annualPayment: z.string().optional().default(""),
  paymentYears: z.number().int().nullable().optional(),
  paymentDownPct: z.number().int().nullable().optional(),
  showPrice: z.boolean().optional().default(true),
  showDownpayment: z.boolean().optional().default(true),
  showMonthly: z.boolean().optional().default(true),
  showFullPrice: z.boolean().optional().default(false),
  showAnnual: z.boolean().optional().default(false),
  showCompound: z.boolean().optional().default(true),
  featured: z.boolean().default(false),
  areaSlug: z.string().default("new-capital"),
});

const updateListingSchema = z.object({
  id: z.number().int().positive(),
  showPrice: z.boolean().optional(),
  showDownpayment: z.boolean().optional(),
  showMonthly: z.boolean().optional(),
  showFullPrice: z.boolean().optional(),
  showAnnual: z.boolean().optional(),
  showCompound: z.boolean().optional(),
  annualPayment: z.string().optional(),
  paymentYears: z.number().int().nullable().optional(),
  paymentDownPct: z.number().int().nullable().optional(),
});

describe('Pricing Visibility - Schema Validation', () => {
  it('create schema accepts all visibility fields', () => {
    const input = {
      titleAr: 'Test',
      titleEn: 'Test',
      price: '5,000,000',
      showPrice: true,
      showDownpayment: true,
      showMonthly: false,
      showFullPrice: true,
      showAnnual: false,
      showCompound: true,
      annualPayment: '600000',
      paymentYears: 5,
      paymentDownPct: 10,
    };
    const result = createListingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showFullPrice).toBe(true);
      expect(result.data.showMonthly).toBe(false);
      expect(result.data.showAnnual).toBe(false);
      expect(result.data.annualPayment).toBe('600000');
      expect(result.data.paymentYears).toBe(5);
      expect(result.data.paymentDownPct).toBe(10);
    }
  });

  it('create schema defaults visibility fields correctly', () => {
    const input = { titleAr: 'Test', titleEn: 'Test', price: '1000000' };
    const result = createListingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showPrice).toBe(true);
      expect(result.data.showDownpayment).toBe(true);
      expect(result.data.showMonthly).toBe(true);
      expect(result.data.showFullPrice).toBe(false);
      expect(result.data.showAnnual).toBe(false);
      expect(result.data.showCompound).toBe(true);
    }
  });

  it('update schema accepts partial visibility updates', () => {
    const input = {
      id: 1,
      showFullPrice: true,
      showAnnual: true,
      annualPayment: '500000',
    };
    const result = updateListingSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showFullPrice).toBe(true);
      expect(result.data.showAnnual).toBe(true);
      expect(result.data.showDownpayment).toBeUndefined(); // not provided = not updated
    }
  });
});

describe('Pricing Visibility - Boolean to Int Conversion', () => {
  // Simulate the formatRow logic from listingsRouter
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
    };
  }

  it('converts DB int values to booleans correctly', () => {
    const dbRow = {
      id: 1,
      showPrice: 1,
      showDownpayment: 1,
      showMonthly: 0,
      showFullPrice: 1,
      showAnnual: 0,
      showCompound: 1,
      featured: 0,
      active: 1,
    };
    const formatted = formatRow(dbRow);
    expect(formatted.showPrice).toBe(true);
    expect(formatted.showDownpayment).toBe(true);
    expect(formatted.showMonthly).toBe(false);
    expect(formatted.showFullPrice).toBe(true);
    expect(formatted.showAnnual).toBe(false);
    expect(formatted.showCompound).toBe(true);
  });

  it('converts all zeros to false', () => {
    const dbRow = {
      id: 2,
      showPrice: 0,
      showDownpayment: 0,
      showMonthly: 0,
      showFullPrice: 0,
      showAnnual: 0,
      showCompound: 0,
      featured: 0,
      active: 0,
    };
    const formatted = formatRow(dbRow);
    expect(formatted.showPrice).toBe(false);
    expect(formatted.showDownpayment).toBe(false);
    expect(formatted.showMonthly).toBe(false);
    expect(formatted.showFullPrice).toBe(false);
    expect(formatted.showAnnual).toBe(false);
    expect(formatted.showCompound).toBe(false);
  });
});

describe('Pricing Visibility - Update Mutation Logic', () => {
  // Simulate the update mutation's boolean-to-int conversion
  const booleanFields = ['showPrice', 'showDownpayment', 'showMonthly', 'showFullPrice', 'showAnnual', 'showCompound', 'featured', 'active'];
  
  function buildUpdateData(data: Record<string, any>) {
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (booleanFields.includes(key)) {
        updateData[key] = value ? 1 : 0;
      } else {
        updateData[key] = value;
      }
    }
    return updateData;
  }

  it('converts boolean visibility fields to integers for DB', () => {
    const input = {
      showFullPrice: true,
      showDownpayment: false,
      showMonthly: true,
      showAnnual: true,
    };
    const updateData = buildUpdateData(input);
    expect(updateData.showFullPrice).toBe(1);
    expect(updateData.showDownpayment).toBe(0);
    expect(updateData.showMonthly).toBe(1);
    expect(updateData.showAnnual).toBe(1);
  });

  it('skips undefined fields', () => {
    const input = {
      showFullPrice: true,
      showDownpayment: undefined,
    };
    const updateData = buildUpdateData(input);
    expect(updateData.showFullPrice).toBe(1);
    expect(updateData.showDownpayment).toBeUndefined();
  });
});
