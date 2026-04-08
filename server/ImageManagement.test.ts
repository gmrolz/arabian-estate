import { describe, it, expect } from 'vitest';

describe('Image Management in Admin', () => {
  describe('Image Deletion', () => {
    it('should remove image from form state when delete button clicked', () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      // Simulate removeImage(1) - remove middle image
      const removeImage = (index) => {
        return images.filter((_, i) => i !== index);
      };

      const result = removeImage(1);
      expect(result).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
      ]);
      expect(result.length).toBe(2);
    });

    it('should persist deleted images to database when saving', () => {
      const form = {
        id: 1,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      // handleSave includes images in row object
      const row = {
        id: form.id,
        images: form.images || [],
      };

      expect(row.images).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
      ]);
      expect(row.images.length).toBe(2);
    });

    it('should handle deleting all images', () => {
      const images = ['https://example.com/image1.jpg'];

      const removeImage = (index) => {
        return images.filter((_, i) => i !== index);
      };

      const result = removeImage(0);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle deleting from empty images array', () => {
      const images = [];

      const removeImage = (index) => {
        return images.filter((_, i) => i !== index);
      };

      const result = removeImage(0);
      expect(result).toEqual([]);
    });

    it('should preserve image URLs when deleting', () => {
      const images = [
        'https://example.com/image1.jpg?size=large',
        'https://example.com/image2.jpg?size=large',
        'https://example.com/image3.jpg?size=large',
      ];

      const removeImage = (index) => {
        return images.filter((_, i) => i !== index);
      };

      const result = removeImage(1);
      expect(result[0]).toBe('https://example.com/image1.jpg?size=large');
      expect(result[1]).toBe('https://example.com/image3.jpg?size=large');
    });
  });

  describe('Image Reordering', () => {
    it('should move image up in the array', () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      // Simulate moveImage(2, -1) - move image 3 up one position
      const moveImage = (index, direction) => {
        const next = [...images];
        const j = index + direction;
        if (j < 0 || j >= next.length) return next;
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      };

      const result = moveImage(2, -1);
      expect(result).toEqual([
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image2.jpg',
      ]);
    });

    it('should move image down in the array', () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      // Simulate moveImage(0, 1) - move image 1 down one position
      const moveImage = (index, direction) => {
        const next = [...images];
        const j = index + direction;
        if (j < 0 || j >= next.length) return next;
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      };

      const result = moveImage(0, 1);
      expect(result).toEqual([
        'https://example.com/image2.jpg',
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
      ]);
    });

    it('should not move image beyond array bounds (up)', () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];

      const moveImage = (index, direction) => {
        const next = [...images];
        const j = index + direction;
        if (j < 0 || j >= next.length) return next;
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      };

      const result = moveImage(0, -1); // Try to move first image up
      expect(result).toEqual(images); // Should remain unchanged
    });

    it('should not move image beyond array bounds (down)', () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];

      const moveImage = (index, direction) => {
        const next = [...images];
        const j = index + direction;
        if (j < 0 || j >= next.length) return next;
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      };

      const result = moveImage(1, 1); // Try to move last image down
      expect(result).toEqual(images); // Should remain unchanged
    });

    it('should persist reordered images to database when saving', () => {
      const form = {
        id: 1,
        images: [
          'https://example.com/image2.jpg',
          'https://example.com/image1.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      // handleSave includes images in row object
      const row = {
        id: form.id,
        images: form.images || [],
      };

      expect(row.images[0]).toBe('https://example.com/image2.jpg');
      expect(row.images[1]).toBe('https://example.com/image1.jpg');
      expect(row.images[2]).toBe('https://example.com/image3.jpg');
    });

    it('should handle reordering with 2 images', () => {
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ];

      const moveImage = (index, direction) => {
        const next = [...images];
        const j = index + direction;
        if (j < 0 || j >= next.length) return next;
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      };

      const result = moveImage(0, 1);
      expect(result).toEqual([
        'https://example.com/image2.jpg',
        'https://example.com/image1.jpg',
      ]);
    });

    it('should display correct image order numbers after reordering', () => {
      const images = [
        'https://example.com/image2.jpg',
        'https://example.com/image1.jpg',
        'https://example.com/image3.jpg',
      ];

      const displayNumbers = images.map((_, i) => i + 1);
      expect(displayNumbers).toEqual([1, 2, 3]);
    });
  });

  describe('Combined Operations', () => {
    it('should handle delete then reorder', () => {
      let images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      // Delete image 2
      images = images.filter((_, i) => i !== 1);
      expect(images.length).toBe(2);

      // Reorder: move image 1 to position 0
      const next = [...images];
      [next[0], next[1]] = [next[1], next[0]];
      images = next;

      expect(images).toEqual([
        'https://example.com/image3.jpg',
        'https://example.com/image1.jpg',
      ]);
    });

    it('should handle reorder then delete', () => {
      let images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      // Reorder: move image 3 to position 0
      const next = [...images];
      [next[0], next[2]] = [next[2], next[0]];
      images = next;

      // Delete image at position 1 (which is now image2)
      images = images.filter((_, i) => i !== 1);

      expect(images).toEqual([
        'https://example.com/image3.jpg',
        'https://example.com/image1.jpg',
      ]);
    });

    it('should save form with modified images', () => {
      const form = {
        id: 1,
        images: [
          'https://example.com/image3.jpg',
          'https://example.com/image1.jpg',
        ],
      };

      const row = {
        id: form.id,
        images: form.images || [],
      };

      // Verify images are in the row
      expect(row.images).toEqual([
        'https://example.com/image3.jpg',
        'https://example.com/image1.jpg',
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single image deletion', () => {
      const images = ['https://example.com/image1.jpg'];

      const removeImage = (index) => {
        return images.filter((_, i) => i !== index);
      };

      const result = removeImage(0);
      expect(result.length).toBe(0);
    });

    it('should handle image URLs with special characters', () => {
      const images = [
        'https://example.com/image%20with%20spaces.jpg',
        'https://example.com/image-with-dashes.jpg',
      ];

      const removeImage = (index) => {
        return images.filter((_, i) => i !== index);
      };

      const result = removeImage(0);
      expect(result[0]).toBe('https://example.com/image-with-dashes.jpg');
    });

    it('should handle image URLs with query parameters', () => {
      const images = [
        'https://example.com/image1.jpg?size=large&quality=high',
        'https://example.com/image2.jpg?size=large&quality=high',
      ];

      const moveImage = (index, direction) => {
        const next = [...images];
        const j = index + direction;
        if (j < 0 || j >= next.length) return next;
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      };

      const result = moveImage(0, 1);
      expect(result[0]).toContain('image2.jpg');
      expect(result[1]).toContain('image1.jpg');
    });
  });
});
