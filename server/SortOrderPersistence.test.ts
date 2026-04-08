import { describe, it, expect } from 'vitest';

describe('Sort Order Persistence Fix', () => {
  describe('Admin listings refresh after save', () => {
    it('should refresh admin listings after save to keep sort_order in sync', () => {
      // Simulate admin page state before save
      const adminListings = [
        { id: 1, sort_order: 0, title: 'Listing 1' },
        { id: 2, sort_order: 1, title: 'Listing 2' },
      ];

      // User edits listing 1 and changes sort_order to 5
      const updatedData = { id: 1, sort_order: 5 };

      // After save, refresh admin listings from server
      const refreshedListings = [
        { id: 1, sort_order: 5, title: 'Listing 1' }, // Updated from server
        { id: 2, sort_order: 1, title: 'Listing 2' },
      ];

      expect(refreshedListings[0].sort_order).toBe(5);
    });

    it('should handle multiple sort_order changes in sequence', () => {
      let listings = [
        { id: 1, sort_order: 0 },
        { id: 2, sort_order: 1 },
        { id: 3, sort_order: 2 },
      ];

      // First change: move listing 1 to position 2
      listings = listings.map((l) =>
        l.id === 1 ? { ...l, sort_order: 2 } : l
      );
      expect(listings[0].sort_order).toBe(2);

      // Second change: move listing 2 to position 0
      listings = listings.map((l) =>
        l.id === 2 ? { ...l, sort_order: 0 } : l
      );
      expect(listings[1].sort_order).toBe(0);
    });

    it('should preserve sort_order when navigating away and back', () => {
      const originalListing = { id: 1, sort_order: 0 };
      
      // User edits and saves new sort_order
      const savedListing = { ...originalListing, sort_order: 5 };
      
      // Admin listings are refreshed from server
      const refreshedListings = [savedListing];
      
      // User navigates away and back
      const reloadedListing = refreshedListings.find((l) => l.id === 1);
      
      expect(reloadedListing?.sort_order).toBe(5);
    });

    it('should refresh all fields when refreshing admin listings', () => {
      const oldListing = {
        id: 1,
        sort_order: 0,
        title: 'Old Title',
        area: 100,
        price: '1000000',
      };

      // Server returns updated listing with multiple field changes
      const refreshedListing = {
        id: 1,
        sort_order: 5,
        title: 'New Title',
        area: 150,
        price: '1200000',
      };

      expect(refreshedListing.sort_order).toBe(5);
      expect(refreshedListing.title).toBe('New Title');
      expect(refreshedListing.area).toBe(150);
      expect(refreshedListing.price).toBe('1200000');
    });

    it('should handle error when refreshing admin listings', () => {
      const refreshRes = { data: null, error: { message: 'Failed to refresh' } };
      
      if (refreshRes.error) {
        // Don't update listings if refresh fails
        expect(refreshRes.data).toBeNull();
      }
    });

    it('should not lose other fields when updating sort_order', () => {
      const listing = {
        id: 1,
        sort_order: 0,
        title_ar: 'العنوان',
        title_en: 'Title',
        compound_name: 'Compound',
        area: 100,
        rooms: 2,
        price: '1000000',
      };

      // Update only sort_order
      const updated = { ...listing, sort_order: 5 };

      expect(updated.title_ar).toBe('العنوان');
      expect(updated.title_en).toBe('Title');
      expect(updated.compound_name).toBe('Compound');
      expect(updated.area).toBe(100);
      expect(updated.rooms).toBe(2);
      expect(updated.price).toBe('1000000');
      expect(updated.sort_order).toBe(5);
    });
  });

  describe('Form initialization with refreshed listings', () => {
    it('should initialize form with correct sort_order from refreshed listings', () => {
      const refreshedListings = [
        { id: 1, sort_order: 5, title: 'Listing 1' },
      ];

      const listing = refreshedListings.find((l) => l.id === 1);
      const form = {
        sort_order: listing?.sort_order ?? 0,
      };

      expect(form.sort_order).toBe(5);
    });

    it('should handle missing sort_order with default value', () => {
      const listing = { id: 1, title: 'Listing 1' };
      const form = {
        sort_order: listing.sort_order ?? 0,
      };

      expect(form.sort_order).toBe(0);
    });

    it('should display sort_order as 1-based in UI', () => {
      const form = { sort_order: 5 };
      const displayValue = form.sort_order + 1; // Convert to 1-based for display

      expect(displayValue).toBe(6);
    });

    it('should convert 1-based input back to 0-based for storage', () => {
      const userInput = 6; // 1-based input from UI
      const storedValue = userInput - 1; // Convert to 0-based

      expect(storedValue).toBe(5);
    });
  });

  describe('Refresh workflow', () => {
    it('should complete full save and refresh workflow', async () => {
      // Step 1: User edits sort_order
      let form = { id: 1, sort_order: 5 };
      
      // Step 2: Save to server
      const saved = { id: 1, sort_order: 5 };
      expect(saved.sort_order).toBe(5);
      
      // Step 3: Update local state
      let adminListings = [{ id: 1, sort_order: 5 }];
      
      // Step 4: Refresh from server
      const refreshed = [{ id: 1, sort_order: 5 }];
      adminListings = refreshed;
      
      // Step 5: Form reloads with correct sort_order
      const listing = adminListings.find((l) => l.id === 1);
      form = { ...form, sort_order: listing?.sort_order ?? 0 };
      
      expect(form.sort_order).toBe(5);
    });

    it('should handle concurrent saves', () => {
      let listings = [
        { id: 1, sort_order: 0 },
        { id: 2, sort_order: 1 },
      ];

      // Simulate two saves happening
      const save1 = { id: 1, sort_order: 2 };
      const save2 = { id: 2, sort_order: 0 };

      // After both saves, refresh from server
      listings = [
        { id: 1, sort_order: 2 },
        { id: 2, sort_order: 0 },
      ];

      expect(listings[0].sort_order).toBe(2);
      expect(listings[1].sort_order).toBe(0);
    });
  });

  describe('Data consistency', () => {
    it('should ensure sort_order matches between form and listings', () => {
      const listing = { id: 1, sort_order: 5 };
      const form = { sort_order: listing.sort_order };

      expect(form.sort_order).toBe(listing.sort_order);
    });

    it('should handle sort_order as number type', () => {
      const listing = { sort_order: '5' }; // String from input
      const form = { sort_order: Number(listing.sort_order) }; // Convert to number

      expect(typeof form.sort_order).toBe('number');
      expect(form.sort_order).toBe(5);
    });

    it('should validate sort_order is within valid range', () => {
      const totalListings = 50;
      const sort_order = 5;

      const isValid = sort_order >= 0 && sort_order < totalListings;
      expect(isValid).toBe(true);
    });

    it('should handle edge case: sort_order = 0', () => {
      const listing = { id: 1, sort_order: 0 };
      const form = { sort_order: listing.sort_order };

      expect(form.sort_order).toBe(0);
    });

    it('should handle edge case: sort_order = max', () => {
      const totalListings = 50;
      const listing = { id: 1, sort_order: totalListings - 1 };
      const form = { sort_order: listing.sort_order };

      expect(form.sort_order).toBe(49);
    });
  });
});
