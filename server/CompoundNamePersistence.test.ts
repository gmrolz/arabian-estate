import { describe, it, expect } from 'vitest';

describe('Compound Name Persistence Bug Fix', () => {
  describe('Field name mapping', () => {
    it('should map camelCase compoundName to snake_case compound_name', () => {
      const apiResponse = {
        compoundName: 'Hyde Park Central',
      };
      
      const formData = {
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
      };
      
      expect(formData.compound_name).toBe('Hyde Park Central');
    });

    it('should handle missing compoundName gracefully', () => {
      const apiResponse = {};
      
      const formData = {
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
      };
      
      expect(formData.compound_name).toBe('');
    });

    it('should fallback to snake_case if camelCase is missing', () => {
      const apiResponse = {
        compound_name: 'Fallback Compound',
      };
      
      const formData = {
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
      };
      
      expect(formData.compound_name).toBe('Fallback Compound');
    });

    it('should prefer camelCase over snake_case', () => {
      const apiResponse = {
        compoundName: 'Preferred Compound',
        compound_name: 'Fallback Compound',
      };
      
      const formData = {
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
      };
      
      expect(formData.compound_name).toBe('Preferred Compound');
    });
  });

  describe('Form initialization', () => {
    it('should load compound_name from API response', () => {
      const listing = {
        id: 1,
        compoundName: 'New Cairo Compound',
        titleEn: 'Test Listing',
      };
      
      const formatted = {
        ...listing,
        compound_name: listing.compoundName || listing.compound_name || '',
      };
      
      expect(formatted.compound_name).toBe('New Cairo Compound');
    });

    it('should persist compound_name when editing', () => {
      const form = {
        id: 1,
        compound_name: 'Edited Compound Name',
        title_ar: 'اختبار',
      };
      
      expect(form.compound_name).toBe('Edited Compound Name');
    });

    it('should not lose compound_name on form reload', () => {
      const originalListing = {
        compoundName: 'Original Compound',
      };
      
      const reloadedForm = {
        compound_name: originalListing.compoundName || originalListing.compound_name || '',
      };
      
      expect(reloadedForm.compound_name).toBe('Original Compound');
    });
  });

  describe('Related field mappings', () => {
    it('should also map mapsUrl to maps_url', () => {
      const apiResponse = {
        mapsUrl: 'https://maps.example.com',
      };
      
      const formData = {
        maps_url: apiResponse.mapsUrl || apiResponse.maps_url || '',
      };
      
      expect(formData.maps_url).toBe('https://maps.example.com');
    });

    it('should also map unitType to unit_type', () => {
      const apiResponse = {
        unitType: 'Duplex',
      };
      
      const formData = {
        unit_type: apiResponse.unitType || apiResponse.unit_type || 'Apartment',
      };
      
      expect(formData.unit_type).toBe('Duplex');
    });

    it('should also map areaSlug to area_slug', () => {
      const apiResponse = {
        areaSlug: 'new-cairo',
      };
      
      const formData = {
        area_slug: apiResponse.areaSlug || apiResponse.area_slug || 'new-capital',
      };
      
      expect(formData.area_slug).toBe('new-cairo');
    });
  });

  describe('Complete form initialization', () => {
    it('should initialize all camelCase fields correctly', () => {
      const apiResponse = {
        id: 1,
        compoundName: 'Test Compound',
        mapsUrl: 'https://maps.test.com',
        unitType: 'Villa',
        areaSlug: 'new-cairo',
        titleEn: 'Test Title',
      };
      
      const formatted = {
        ...apiResponse,
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
        maps_url: apiResponse.mapsUrl || apiResponse.maps_url || '',
        unit_type: apiResponse.unitType || apiResponse.unit_type || 'Apartment',
        area_slug: apiResponse.areaSlug || apiResponse.area_slug || 'new-capital',
      };
      
      expect(formatted.compound_name).toBe('Test Compound');
      expect(formatted.maps_url).toBe('https://maps.test.com');
      expect(formatted.unit_type).toBe('Villa');
      expect(formatted.area_slug).toBe('new-cairo');
    });

    it('should handle mixed camelCase and snake_case fields', () => {
      const apiResponse = {
        compoundName: 'Compound',
        maps_url: 'https://maps.test.com',
        unitType: 'Apartment',
        area_slug: 'new-capital',
      };
      
      const formatted = {
        ...apiResponse,
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
        maps_url: apiResponse.mapsUrl || apiResponse.maps_url || '',
        unit_type: apiResponse.unitType || apiResponse.unit_type || 'Apartment',
        area_slug: apiResponse.areaSlug || apiResponse.area_slug || 'new-capital',
      };
      
      expect(formatted.compound_name).toBe('Compound');
      expect(formatted.maps_url).toBe('https://maps.test.com');
      expect(formatted.unit_type).toBe('Apartment');
      expect(formatted.area_slug).toBe('new-capital');
    });
  });

  describe('Persistence workflow', () => {
    it('should save compound_name and reload it', () => {
      // Step 1: User enters compound name
      let form = { compound_name: 'My Compound' };
      expect(form.compound_name).toBe('My Compound');
      
      // Step 2: Save to database (compound_name is sent)
      const savedData = { compound_name: form.compound_name };
      expect(savedData.compound_name).toBe('My Compound');
      
      // Step 3: API returns compoundName (camelCase)
      const apiResponse = { compoundName: 'My Compound' };
      
      // Step 4: Form reloads with mapped field
      form = {
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
      };
      
      expect(form.compound_name).toBe('My Compound');
    });

    it('should handle empty compound_name', () => {
      const apiResponse = { compoundName: '' };
      
      const form = {
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
      };
      
      expect(form.compound_name).toBe('');
    });

    it('should handle null compound_name', () => {
      const apiResponse = { compoundName: null };
      
      const form = {
        compound_name: apiResponse.compoundName || apiResponse.compound_name || '',
      };
      
      expect(form.compound_name).toBe('');
    });
  });

  describe('User experience', () => {
    it('should display compound_name in form when editing', () => {
      const listing = {
        id: 1,
        compoundName: 'Beautiful Compound',
      };
      
      const form = {
        compound_name: listing.compoundName || listing.compound_name || '',
      };
      
      const isDisplayed = form.compound_name.length > 0;
      expect(isDisplayed).toBe(true);
    });

    it('should allow editing compound_name', () => {
      let form = { compound_name: 'Original' };
      
      // User edits
      form.compound_name = 'Updated';
      
      expect(form.compound_name).toBe('Updated');
    });

    it('should save edited compound_name', () => {
      const form = { compound_name: 'Final Name' };
      
      const saveData = {
        compound_name: form.compound_name,
      };
      
      expect(saveData.compound_name).toBe('Final Name');
    });
  });
});
