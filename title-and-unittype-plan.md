# Implementation Plan: Fix Frontend Titles + Add Unit Type Field

## Issue 1: Frontend Titles Not Appearing

**Root Cause:**
- `ListingsContext.normalizeRow()` correctly maps `titleEn` → `title`
- BUT `LocationFunnelPage` fetches listings directly from tRPC API without normalizing
- PropertyCard receives raw `{ titleEn, titleAr, ... }` instead of `{ title, ... }`
- PropertyCard looks for `title` field which doesn't exist

**Solution:**
1. Create a shared `normalizeListingRow()` utility function in `src/lib/listingsApi.js`
2. Use it in both `ListingsContext.normalizeRow()` and `LocationFunnelPage.fetchListingsByLocationIds()`
3. Ensures all listings are normalized consistently before reaching PropertyCard

**Files to Change:**
- `src/lib/listingsApi.js` - Add shared normalizeListingRow() function
- `src/context/ListingsContext.jsx` - Use shared function
- `src/pages/LocationFunnelPage.jsx` - Normalize fetched listings

---

## Issue 2: Add Unit Type Field

**Current State:**
- Database already has `unitType` field (confirmed in API response)
- `ListingsContext.normalizeRow()` already maps it to `unit_type`
- Admin form doesn't have a selector for it
- Frontend doesn't display it

**Solution:**

### 2a. Add to Admin Form
- Add `unit_type` field to AdminListingEdit form
- Create dropdown with options: Studio, 1 Bed, 2 Bed, 3 Bed, Penthouse, Villa
- Include in `buildListingRow()` and `handleSave()`

### 2b. Display on Frontend
- Add unit type display to PropertyCard component
- Show in listing card (e.g., "2 Bed Apartment")
- Include in WhatsApp message template

### 2c. Migrate Existing Units
- Set default unit_type for all existing listings based on `rooms` field:
  - 0 rooms → "Studio"
  - 1 room → "1 Bed"
  - 2 rooms → "2 Bed"
  - 3 rooms → "3 Bed"
  - 4+ rooms → "Villa" or "Penthouse"

**Files to Change:**
- `src/pages/admin/AdminListingEdit.jsx` - Add unit_type selector
- `src/components/PropertyCard.jsx` - Display unit_type
- `server/listingsRouter.ts` - Add migration script (optional)
- `src/lib/listingsApi.js` - Update upsertListing to include unit_type

---

## Implementation Order

1. **Fix titles first** (quick win, unblocks display)
   - Create shared normalizeListingRow()
   - Update ListingsContext
   - Update LocationFunnelPage
   - Verify titles appear on frontend

2. **Add unit type** (feature addition)
   - Add to admin form
   - Add to PropertyCard display
   - Migrate existing units

---

## Testing Strategy

- [ ] Verify titles appear on ListingsPage (uses ListingsContext)
- [ ] Verify titles appear on LocationFunnelPage (uses direct API)
- [ ] Verify titles appear on featured listings
- [ ] Verify unit_type displays on PropertyCard
- [ ] Verify unit_type selector works in admin form
- [ ] Verify new listings can set unit_type
- [ ] Verify existing listings have unit_type values after migration
