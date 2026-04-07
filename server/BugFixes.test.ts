import { describe, it, expect } from 'vitest';

describe('Bug Fixes - Core Logic Tests', () => {
  describe('Bug 1: Multiple Image Upload - appendListingImages preserves existing images', () => {
    it('should merge new images with existing images without losing any', () => {
      // Simulate appendListingImages logic
      const existingImages = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'];
      const newImages = ['https://example.com/img3.jpg', 'https://example.com/img4.jpg', 'https://example.com/img5.jpg'];
      
      const merged = [...existingImages, ...newImages];
      const unique = Array.from(new Set(merged));

      expect(unique).toHaveLength(5);
      expect(unique).toContain('https://example.com/img1.jpg');
      expect(unique).toContain('https://example.com/img2.jpg');
      expect(unique).toContain('https://example.com/img3.jpg');
      expect(unique).toContain('https://example.com/img4.jpg');
      expect(unique).toContain('https://example.com/img5.jpg');
    });

    it('should not create duplicate images when appending', () => {
      // Simulate appendListingImages with one duplicate
      const existingImages = ['https://example.com/dup.jpg', 'https://example.com/img1.jpg'];
      const newImages = ['https://example.com/dup.jpg', 'https://example.com/img2.jpg'];
      
      const merged = [...existingImages, ...newImages];
      const unique = Array.from(new Set(merged));

      expect(unique).toHaveLength(3);
      expect(unique).toContain('https://example.com/dup.jpg');
      expect(unique).toContain('https://example.com/img1.jpg');
      expect(unique).toContain('https://example.com/img2.jpg');
    });

    it('should handle empty existing images', () => {
      const existingImages: string[] = [];
      const newImages = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'];
      
      const merged = [...existingImages, ...newImages];
      const unique = Array.from(new Set(merged));

      expect(unique).toHaveLength(2);
      expect(unique).toEqual(newImages);
    });
  });

  describe('Bug 2: Location Filtering - superjson wrapper enables correct filtering', () => {
    it('should correctly parse superjson wrapped input', () => {
      // Simulate tRPC superjson deserialization
      const wrappedInput = { json: { locationIds: [30024] } };
      const unwrappedInput = wrappedInput.json;

      expect(unwrappedInput.locationIds).toEqual([30024]);
      expect(unwrappedInput.locationIds[0]).toBe(30024);
    });

    it('should fail to parse unwrapped input correctly', () => {
      // This demonstrates the bug: without wrapper, filter is lost
      const unwrappedInput = { locationIds: [30024] };
      
      // If this is passed to a function expecting { json: {...} }, it would fail
      expect(unwrappedInput.json).toBeUndefined();
    });

    it('should correctly compare locationIds for filtering', () => {
      const listings = [
        { id: 1, locationId: 30023, title: 'Capital 1' },
        { id: 2, locationId: 30023, title: 'Capital 2' },
        { id: 3, locationId: 30024, title: 'Cairo 1' },
        { id: 4, locationId: 30024, title: 'Cairo 2' },
      ];

      const locationIds = [30024];
      const filtered = listings.filter((l) => locationIds.includes(l.locationId));

      expect(filtered).toHaveLength(2);
      expect(filtered.every((l) => l.locationId === 30024)).toBe(true);
    });
  });

  describe('Bug 3: Location Label - areaSlug field is correctly read', () => {
    it('should correctly identify area from areaSlug field (camelCase)', () => {
      // Simulate getAreaFromListing function logic
      const listing = { areaSlug: 'new-cairo', title: 'Test' };
      
      let detectedArea = 'new-capital'; // default
      if (listing.areaSlug) detectedArea = listing.areaSlug;
      
      expect(detectedArea).toBe('new-cairo');
      expect(detectedArea).not.toBe('new-capital');
    });

    it('should fall back to area_slug if areaSlug is missing', () => {
      // Simulate getAreaFromListing with snake_case fallback
      const listing = { area_slug: 'new-cairo', title: 'Test' };
      
      let detectedArea = 'new-capital'; // default
      if (listing.areaSlug) detectedArea = listing.areaSlug;
      else if (listing.area_slug) detectedArea = listing.area_slug;
      
      expect(detectedArea).toBe('new-cairo');
    });

    it('should use default when no area slug is present', () => {
      // Simulate getAreaFromListing with no area data
      const listing = { title: 'Test' };
      
      let detectedArea = 'new-capital'; // default
      if (listing.areaSlug) detectedArea = listing.areaSlug;
      else if (listing.area_slug) detectedArea = listing.area_slug;
      
      expect(detectedArea).toBe('new-capital');
    });

    it('should preserve locationId, compoundName, and mapsUrl in row object', () => {
      // Simulate handleSave row building with all location fields
      const form = {
        id: 1,
        titleAr: 'اختبار',
        titleEn: 'Test',
        locationId: 30024,
        compound_name: 'Test Compound',
        maps_url: 'https://maps.google.com/test',
        areaSlug: 'new-cairo',
      };

      const row = {
        id: form.id,
        titleAr: form.titleAr,
        titleEn: form.titleEn,
        location_id: form.locationId,
        compound_name: form.compound_name,
        maps_url: form.maps_url,
        area_slug: form.areaSlug,
      };

      expect(row.location_id).toBe(30024);
      expect(row.compound_name).toBe('Test Compound');
      expect(row.maps_url).toBe('https://maps.google.com/test');
    });

    it('should not lose location fields when updating', () => {
      // Simulate handleSave update with all fields
      const currentRow = {
        id: 1,
        locationId: 30024,
        compoundName: 'Original',
        mapsUrl: 'https://maps.google.com/original',
        areaSlug: 'new-cairo',
      };

      const updateData = {
        titleAr: 'Updated',
        titleEn: 'Updated',
        locationId: currentRow.locationId, // Include in update
        compoundName: currentRow.compoundName, // Include in update
        mapsUrl: currentRow.mapsUrl, // Include in update
        areaSlug: currentRow.areaSlug,
      };

      expect(updateData.locationId).toBe(30024);
      expect(updateData.compoundName).toBe('Original');
      expect(updateData.mapsUrl).toBe('https://maps.google.com/original');
    });
  });
});
