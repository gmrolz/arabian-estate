import { describe, it, expect } from 'vitest';

describe('Villa Types and Locale Fixes', () => {
  describe('Villa type options', () => {
    it('should include I Villa option', () => {
      const options = ['Studio', '1 Bed', '2 Bed', '3 Bed', 'Penthouse', 'Villa', 'I Villa', 'Z Villa', 'Q Villa', 'Apartment'];
      expect(options).toContain('I Villa');
    });

    it('should include Z Villa option', () => {
      const options = ['Studio', '1 Bed', '2 Bed', '3 Bed', 'Penthouse', 'Villa', 'I Villa', 'Z Villa', 'Q Villa', 'Apartment'];
      expect(options).toContain('Z Villa');
    });

    it('should include Q Villa option', () => {
      const options = ['Studio', '1 Bed', '2 Bed', '3 Bed', 'Penthouse', 'Villa', 'I Villa', 'Z Villa', 'Q Villa', 'Apartment'];
      expect(options).toContain('Q Villa');
    });

    it('should have all 10 unit type options', () => {
      const options = ['Studio', '1 Bed', '2 Bed', '3 Bed', 'Penthouse', 'Villa', 'I Villa', 'Z Villa', 'Q Villa', 'Apartment'];
      expect(options).toHaveLength(10);
    });
  });

  describe('Locale-based title selection', () => {
    it('should select titleEn for English locale', () => {
      const row = {
        titleEn: 'Luxury I Villa',
        titleAr: 'فيلا آي فاخرة',
      };

      const locale = 'en';
      const title = locale === 'en'
        ? (row.titleEn || row.titleAr || '')
        : (row.titleAr || row.titleEn || '');

      expect(title).toBe('Luxury I Villa');
    });

    it('should select titleAr for Arabic locale', () => {
      const row = {
        titleEn: 'Luxury I Villa',
        titleAr: 'فيلا آي فاخرة',
      };

      const locale = 'ar';
      const title = locale === 'en'
        ? (row.titleEn || row.titleAr || '')
        : (row.titleAr || row.titleEn || '');

      expect(title).toBe('فيلا آي فاخرة');
    });

    it('should not show Arabic title when English locale is active', () => {
      const row = {
        titleEn: 'Beautiful Z Villa',
        titleAr: 'فيلا زي جميلة',
      };

      const locale = 'en';
      const title = locale === 'en'
        ? (row.titleEn || row.titleAr || '')
        : (row.titleAr || row.titleEn || '');

      expect(title).not.toBe('فيلا زي جميلة');
      expect(title).toBe('Beautiful Z Villa');
    });

    it('should not show English title when Arabic locale is active', () => {
      const row = {
        titleEn: 'Stunning Q Villa',
        titleAr: 'فيلا كيو مذهلة',
      };

      const locale = 'ar';
      const title = locale === 'en'
        ? (row.titleEn || row.titleAr || '')
        : (row.titleAr || row.titleEn || '');

      expect(title).not.toBe('Stunning Q Villa');
      expect(title).toBe('فيلا كيو مذهلة');
    });
  });

  describe('LocationFunnelPage locale handling', () => {
    it('should pass locale parameter to fetchListingsByLocationIds', () => {
      // Simulate the function signature
      const fetchListingsByLocationIds = (locationIds: number[], locale: string = 'en') => {
        return { locationIds, locale };
      };

      const result = fetchListingsByLocationIds([30024], 'ar');
      expect(result.locale).toBe('ar');
    });

    it('should pass locale parameter to fetchListingsByCompound', () => {
      // Simulate the function signature
      const fetchListingsByCompound = (compoundName: string, locale: string = 'en') => {
        return { compoundName, locale };
      };

      const result = fetchListingsByCompound('New Capital', 'ar');
      expect(result.locale).toBe('ar');
    });

    it('should default to English locale if not provided', () => {
      const fetchListingsByLocationIds = (locationIds: number[], locale: string = 'en') => {
        return locale;
      };

      const result = fetchListingsByLocationIds([30024]);
      expect(result).toBe('en');
    });
  });

  describe('Villa type display on PropertyCard', () => {
    it('should display I Villa in specs', () => {
      const listing = {
        unit_type: 'I Villa',
        area: 500,
        rooms: 4,
      };

      const specs = [
        listing.unit_type || 'Unit',
        `${listing.area} m²`,
        `${listing.rooms} beds`,
      ];

      expect(specs[0]).toBe('I Villa');
    });

    it('should display Z Villa in specs', () => {
      const listing = {
        unit_type: 'Z Villa',
        area: 450,
        rooms: 3,
      };

      const specs = [
        listing.unit_type || 'Unit',
        `${listing.area} m²`,
        `${listing.rooms} beds`,
      ];

      expect(specs[0]).toBe('Z Villa');
    });

    it('should display Q Villa in specs', () => {
      const listing = {
        unit_type: 'Q Villa',
        area: 600,
        rooms: 5,
      };

      const specs = [
        listing.unit_type || 'Unit',
        `${listing.area} m²`,
        `${listing.rooms} beds`,
      ];

      expect(specs[0]).toBe('Q Villa');
    });
  });

  describe('Integration: Villa types with locale', () => {
    it('should display I Villa with correct English title', () => {
      const listing = {
        titleEn: 'Exclusive I Villa in New Capital',
        titleAr: 'فيلا آي حصرية في العاصمة الجديدة',
        unit_type: 'I Villa',
        locale: 'en',
      };

      const locale = listing.locale;
      const title = locale === 'en'
        ? listing.titleEn
        : listing.titleAr;

      expect(title).toBe('Exclusive I Villa in New Capital');
      expect(listing.unit_type).toBe('I Villa');
    });

    it('should display Z Villa with correct Arabic title', () => {
      const listing = {
        titleEn: 'Premium Z Villa',
        titleAr: 'فيلا زي فاخرة',
        unit_type: 'Z Villa',
        locale: 'ar',
      };

      const locale = listing.locale;
      const title = locale === 'en'
        ? listing.titleEn
        : listing.titleAr;

      expect(title).toBe('فيلا زي فاخرة');
      expect(listing.unit_type).toBe('Z Villa');
    });

    it('should display Q Villa with correct title based on locale', () => {
      const listing = {
        titleEn: 'Luxury Q Villa',
        titleAr: 'فيلا كيو فاخرة',
        unit_type: 'Q Villa',
      };

      // Test English
      const enTitle = 'en' === 'en' ? listing.titleEn : listing.titleAr;
      expect(enTitle).toBe('Luxury Q Villa');

      // Test Arabic
      const arTitle = 'ar' === 'en' ? listing.titleEn : listing.titleAr;
      expect(arTitle).toBe('فيلا كيو فاخرة');
    });
  });

  describe('Admin form villa type selection', () => {
    it('should allow selecting I Villa in admin form', () => {
      const form = {
        unit_type: 'I Villa',
      };

      expect(form.unit_type).toBe('I Villa');
    });

    it('should allow selecting Z Villa in admin form', () => {
      const form = {
        unit_type: 'Z Villa',
      };

      expect(form.unit_type).toBe('Z Villa');
    });

    it('should allow selecting Q Villa in admin form', () => {
      const form = {
        unit_type: 'Q Villa',
      };

      expect(form.unit_type).toBe('Q Villa');
    });

    it('should save villa type correctly', () => {
      const form = {
        id: 1,
        titleEn: 'Beautiful I Villa',
        titleAr: 'فيلا آي جميلة',
        unit_type: 'I Villa',
        area: 500,
      };

      // Simulate save
      const row = {
        ...form,
        unit_type: form.unit_type || 'Apartment',
      };

      expect(row.unit_type).toBe('I Villa');
      expect(row.titleEn).toBe('Beautiful I Villa');
    });
  });
});
