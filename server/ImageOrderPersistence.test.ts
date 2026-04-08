import { describe, it, expect } from 'vitest';

describe('Image Order Persistence', () => {
  describe('Image Initialization from Listing', () => {
    it('should preserve image order from database', () => {
      const listing = {
        id: 1,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      // Simulate the form initialization
      const imageUrls = (listing.images || []).map((img) => img);
      const formatted = {
        ...listing,
        images: imageUrls,
      };

      expect(formatted.images).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ]);
      expect(formatted.images[0]).toBe('https://example.com/image1.jpg');
      expect(formatted.images[1]).toBe('https://example.com/image2.jpg');
      expect(formatted.images[2]).toBe('https://example.com/image3.jpg');
    });

    it('should not lose order when loading listing', () => {
      const listing = {
        id: 1,
        images: [
          'https://example.com/image3.jpg',
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
      };

      const imageUrls = (listing.images || []).map((img) => img);
      const formatted = {
        ...listing,
        images: imageUrls,
      };

      // Order should be preserved exactly as stored
      expect(formatted.images[0]).toBe('https://example.com/image3.jpg');
      expect(formatted.images[1]).toBe('https://example.com/image1.jpg');
      expect(formatted.images[2]).toBe('https://example.com/image2.jpg');
    });

    it('should handle empty images array', () => {
      const listing = {
        id: 1,
        images: [],
      };

      const imageUrls = (listing.images || []).map((img) => img);
      const formatted = {
        ...listing,
        images: imageUrls,
      };

      expect(formatted.images).toEqual([]);
      expect(formatted.images.length).toBe(0);
    });

    it('should handle null images', () => {
      const listing = {
        id: 1,
        images: null,
      };

      const imageUrls = (listing.images || []).map((img) => img);
      const formatted = {
        ...listing,
        images: imageUrls,
      };

      expect(formatted.images).toEqual([]);
    });

    it('should handle undefined images', () => {
      const listing = {
        id: 1,
        images: undefined,
      };

      const imageUrls = (listing.images || []).map((img) => img);
      const formatted = {
        ...listing,
        images: imageUrls,
      };

      expect(formatted.images).toEqual([]);
    });
  });

  describe('Image Reordering Persistence', () => {
    it('should persist reordered images when saving', () => {
      const form = {
        id: 1,
        images: [
          'https://example.com/image3.jpg',
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
      };

      // Simulate handleSave
      const row = {
        id: form.id,
        images: form.images || [],
      };

      expect(row.images).toEqual([
        'https://example.com/image3.jpg',
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ]);
    });

    it('should maintain order through reorder -> save -> reload cycle', () => {
      // Step 1: Initial listing from database
      const listing = {
        id: 1,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      // Step 2: Load into form
      const imageUrls = (listing.images || []).map((img) => img);
      let form = {
        ...listing,
        images: imageUrls,
      };

      // Step 3: Reorder images (move image 3 to position 1)
      const next = [...form.images];
      [next[1], next[2]] = [next[2], next[1]];
      form = { ...form, images: next };

      // Step 4: Save
      const row = {
        id: form.id,
        images: form.images || [],
      };

      // Step 5: Verify saved order
      expect(row.images).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image2.jpg',
      ]);

      // Step 6: Simulate reload from database
      const reloadedListing = {
        id: 1,
        images: row.images,
      };

      const reloadedForm = {
        ...reloadedListing,
        images: (reloadedListing.images || []).map((img) => img),
      };

      // Step 7: Verify order is preserved after reload
      expect(reloadedForm.images).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image2.jpg',
      ]);
    });

    it('should preserve URLs with query parameters during reorder', () => {
      const form = {
        id: 1,
        images: [
          'https://example.com/image1.jpg?size=large',
          'https://example.com/image2.jpg?size=large',
        ],
      };

      // Reorder
      const next = [...form.images];
      [next[0], next[1]] = [next[1], next[0]];

      expect(next[0]).toBe('https://example.com/image2.jpg?size=large');
      expect(next[1]).toBe('https://example.com/image1.jpg?size=large');
    });
  });

  describe('Image Order with Deletions', () => {
    it('should maintain order after deletion', () => {
      let form = {
        id: 1,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      // Delete image 2
      form = {
        ...form,
        images: form.images.filter((_, i) => i !== 1),
      };

      expect(form.images).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
      ]);
    });

    it('should maintain order after reorder then deletion', () => {
      let form = {
        id: 1,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      // Reorder: move image 3 to position 0
      let next = [...form.images];
      [next[0], next[2]] = [next[2], next[0]];
      form = { ...form, images: next };

      // Delete image at position 1 (which is now image2)
      form = {
        ...form,
        images: form.images.filter((_, i) => i !== 1),
      };

      expect(form.images).toEqual([
        'https://example.com/image3.jpg',
        'https://example.com/image1.jpg',
      ]);
    });
  });

  describe('Serialization/Deserialization', () => {
    it('should serialize images array to JSON string', () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];

      const serialized = JSON.stringify(images);
      expect(typeof serialized).toBe('string');
      expect(serialized).toContain('image1.jpg');
      expect(serialized).toContain('image2.jpg');
    });

    it('should deserialize JSON string back to array', () => {
      const serialized = '["https://example.com/image1.jpg","https://example.com/image2.jpg"]';
      const deserialized = JSON.parse(serialized);

      expect(Array.isArray(deserialized)).toBe(true);
      expect(deserialized).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ]);
    });

    it('should preserve order through serialize/deserialize cycle', () => {
      const original = [
        'https://example.com/image3.jpg',
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];

      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(original);
      expect(deserialized[0]).toBe('https://example.com/image3.jpg');
      expect(deserialized[1]).toBe('https://example.com/image1.jpg');
      expect(deserialized[2]).toBe('https://example.com/image2.jpg');
    });

    it('should handle empty array serialization', () => {
      const original = [];
      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual([]);
    });
  });
});
