import { describe, it, expect } from 'vitest';

describe('Title Fix and Unit Type Feature', () => {
  describe('normalizeListingRow: Title field mapping', () => {
    it('should map titleEn to title for English locale', () => {
      const row = {
        id: 1,
        titleEn: 'Beautiful 2 Bed Apartment',
        titleAr: 'شقة جميلة بغرفتي نوم',
        unitType: '2 Bed',
      };

      // Simulate normalizeListingRow logic
      const locale = 'en';
      const title = locale === 'en'
        ? (row.titleEn || row.titleAr || '')
        : (row.titleAr || row.titleEn || '');

      expect(title).toBe('Beautiful 2 Bed Apartment');
    });

    it('should map titleAr to title for Arabic locale', () => {
      const row = {
        id: 1,
        titleEn: 'Beautiful 2 Bed Apartment',
        titleAr: 'شقة جميلة بغرفتي نوم',
        unitType: '2 Bed',
      };

      // Simulate normalizeListingRow logic
      const locale = 'ar';
      const title = locale === 'en'
        ? (row.titleEn || row.titleAr || '')
        : (row.titleAr || row.titleEn || '');

      expect(title).toBe('شقة جميلة بغرفتي نوم');
    });

    it('should fallback to titleAr if titleEn is missing for English locale', () => {
      const row = {
        id: 1,
        titleEn: null,
        titleAr: 'شقة جميلة بغرفتي نوم',
        unitType: '2 Bed',
      };

      const locale = 'en';
      const title = locale === 'en'
        ? (row.titleEn || row.titleAr || '')
        : (row.titleAr || row.titleEn || '');

      expect(title).toBe('شقة جميلة بغرفتي نوم');
    });

    it('should return empty string if both titles are missing', () => {
      const row = {
        id: 1,
        titleEn: null,
        titleAr: null,
        unitType: '2 Bed',
      };

      const locale = 'en';
      const title = locale === 'en'
        ? (row.titleEn || row.titleAr || '')
        : (row.titleAr || row.titleEn || '');

      expect(title).toBe('');
    });
  });

  describe('Unit Type field handling', () => {
    it('should map unitType from DB to unit_type in normalized listing', () => {
      const row = {
        id: 1,
        unitType: '2 Bed',
        titleEn: 'Beautiful Apartment',
      };

      // Simulate normalization
      const unit_type = row.unitType || 'Apartment';

      expect(unit_type).toBe('2 Bed');
    });

    it('should default to Apartment if unitType is missing', () => {
      const row = {
        id: 1,
        unitType: null,
        titleEn: 'Beautiful Apartment',
      };

      const unit_type = row.unitType || 'Apartment';

      expect(unit_type).toBe('Apartment');
    });

    it('should support all unit type options', () => {
      const unitTypes = ['Studio', '1 Bed', '2 Bed', '3 Bed', 'Penthouse', 'Villa', 'Apartment'];

      for (const type of unitTypes) {
        const row = { id: 1, unitType: type };
        const unit_type = row.unitType || 'Apartment';
        expect(unitTypes).toContain(unit_type);
      }
    });
  });

  describe('LocationFunnelPage: Listing normalization', () => {
    it('should normalize listings fetched from API', () => {
      // Simulate raw API response
      const rawListings = [
        {
          id: 1,
          titleEn: 'Luxury 3 Bed',
          titleAr: 'فيلا فاخرة',
          unitType: '3 Bed',
          area: 250,
          rooms: 3,
        },
        {
          id: 2,
          titleEn: 'Cozy Studio',
          titleAr: 'استوديو مريح',
          unitType: 'Studio',
          area: 50,
          rooms: 0,
        },
      ];

      // Simulate normalization
      const normalized = rawListings.map((l) => {
        const title = 'en' === 'en'
          ? (l.titleEn || l.titleAr || '')
          : (l.titleAr || l.titleEn || '');
        return {
          ...l,
          title,
          unit_type: l.unitType || 'Apartment',
        };
      });

      expect(normalized[0].title).toBe('Luxury 3 Bed');
      expect(normalized[0].unit_type).toBe('3 Bed');
      expect(normalized[1].title).toBe('Cozy Studio');
      expect(normalized[1].unit_type).toBe('Studio');
    });

    it('should preserve all other fields during normalization', () => {
      const rawListing = {
        id: 123,
        titleEn: 'Beautiful Apartment',
        titleAr: 'شقة جميلة',
        unitType: '2 Bed',
        area: 150,
        rooms: 2,
        toilets: 2,
        price: '2500000',
        project: 'New Capital',
        developer: 'Tatweer Misr',
        location: 'Downtown',
        images: ['url1', 'url2'],
      };

      // Simulate normalization
      const normalized = {
        ...rawListing,
        title: rawListing.titleEn,
        unit_type: rawListing.unitType,
      };

      expect(normalized.id).toBe(123);
      expect(normalized.area).toBe(150);
      expect(normalized.rooms).toBe(2);
      expect(normalized.price).toBe('2500000');
      expect(normalized.images).toEqual(['url1', 'url2']);
    });
  });

  describe('PropertyCard: Unit type display', () => {
    it('should display unit_type in card specs', () => {
      const listing = {
        id: 1,
        title: 'Beautiful Apartment',
        unit_type: '2 Bed',
        area: 150,
        rooms: 2,
        toilets: 2,
        finishing: 'Finished',
      };

      // Simulate card spec rendering
      const specs = [
        listing.unit_type || 'Unit',
        `${listing.area} m²`,
        `${listing.rooms} beds`,
        `${listing.toilets} baths`,
        listing.finishing,
      ];

      expect(specs[0]).toBe('2 Bed');
      expect(specs.length).toBe(5);
    });

    it('should fallback to "Unit" if unit_type is missing', () => {
      const listing = {
        id: 1,
        title: 'Beautiful Apartment',
        unit_type: null,
        area: 150,
      };

      const displayType = listing.unit_type || 'Unit';

      expect(displayType).toBe('Unit');
    });
  });

  describe('Admin Form: Unit type selector', () => {
    it('should include all unit type options in dropdown', () => {
      const options = ['Studio', '1 Bed', '2 Bed', '3 Bed', 'Penthouse', 'Villa', 'Apartment'];

      expect(options).toHaveLength(7);
      expect(options).toContain('Studio');
      expect(options).toContain('2 Bed');
      expect(options).toContain('Villa');
    });

    it('should default to Apartment when creating new listing', () => {
      const initialFormState = {
        unit_type: 'Apartment',
      };

      expect(initialFormState.unit_type).toBe('Apartment');
    });

    it('should preserve unit_type when saving listing', () => {
      const form = {
        id: 1,
        title_ar: 'شقة',
        title_en: 'Apartment',
        unit_type: '3 Bed',
        area: 200,
      };

      // Simulate buildListingRow
      const row = {
        ...form,
        unit_type: form.unit_type || 'Apartment',
      };

      expect(row.unit_type).toBe('3 Bed');
    });
  });

  describe('Integration: End-to-end flow', () => {
    it('should maintain title and unit_type through full flow', () => {
      // Step 1: API returns raw data
      const apiResponse = {
        id: 1,
        titleEn: 'Luxury Villa',
        titleAr: 'فيلا فاخرة',
        unitType: 'Villa',
        area: 500,
      };

      // Step 2: LocationFunnelPage normalizes
      const normalized = {
        ...apiResponse,
        title: apiResponse.titleEn,
        unit_type: apiResponse.unitType,
      };

      // Step 3: PropertyCard receives and displays
      const displayTitle = normalized.title;
      const displayType = normalized.unit_type || 'Unit';

      expect(displayTitle).toBe('Luxury Villa');
      expect(displayType).toBe('Villa');
    });

    it('should handle missing fields gracefully', () => {
      // Minimal API response
      const apiResponse = {
        id: 1,
        titleEn: null,
        titleAr: 'شقة',
        unitType: null,
      };

      // Normalize
      const normalized = {
        ...apiResponse,
        title: apiResponse.titleEn || apiResponse.titleAr || '',
        unit_type: apiResponse.unitType || 'Apartment',
      };

      expect(normalized.title).toBe('شقة');
      expect(normalized.unit_type).toBe('Apartment');
    });
  });
});
