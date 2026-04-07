# Bug Analysis - 3 Issues

## Bug 1: Multiple Image Upload Only Saves 1

### Root Cause
The `handleImageUpload` function correctly uploads all files in a loop (lines 252-264), collecting URLs in `uploadedUrls[]`. Then it calls `setListingImages(listingId, uploadedUrls)` which calls `trpcMutation('listings.update', { id, images: urlStrings })`.

**The problem**: `setListingImages` REPLACES the entire images array. When called with only the NEW urls (e.g. 3 new images), it overwrites whatever was in the DB. BUT the real issue is that the `handleSave` function on line 396 ALSO calls `setListingImages(data.id, form.images || [])` after saving - this would overwrite with the form state which may not include the new uploads yet.

**Wait - actually the user says even selecting 3 at once only saves 1.** Let me re-examine:
- The upload loop (lines 252-264) uploads files sequentially with `uploadListingImage(file, listingId)` 
- Each call to `/api/upload` uses `upload.single("file")` - this is fine, it handles one file per request
- The loop collects all URLs in `uploadedUrls`
- Then `setListingImages(listingId, uploadedUrls)` is called with ALL the new URLs
- But this REPLACES the DB images with ONLY the new URLs (doesn't include existing ones)

**The REAL issue**: `setListingImages` replaces the entire array. If you had 0 images and upload 3, it should save 3. But the user says only 1 is saved. 

**Possible cause**: The `handleSave` function (line 396) calls `setListingImages(data.id, form.images || [])` AFTER save. If the form state hasn't been updated with the new images yet, this would overwrite with the old (empty) array. BUT handleSave is only called when clicking Save, not during image upload.

**Another possibility**: Race condition. The `setForm` callback on line 277 updates state, but if the component re-renders and triggers another save, it could overwrite.

**Most likely cause**: The `handleSave` on line 396 calls `await setListingImages(data.id, form.images || [])` which uses the form.images at the time of save. If the user uploads 3 images (which updates form.images to 3), then clicks Save, the handleSave reads form.images which should have 3. But if handleSave is called BEFORE the state update from the upload completes... that's the race condition.

**Actually, re-reading the code more carefully**: After the upload, `setForm` is called inside the success branch (line 277). But `handleSave` is a separate action. The user's workflow is: upload images → they appear in UI → click Save. At that point form.images should have all 3.

**Let me check if the issue is in the upload itself**: The upload loop is sequential. Each `uploadListingImage` call returns a URL. All URLs are collected. Then `setListingImages(listingId, uploadedUrls)` is called with all 3 URLs. This should work.

**WAIT - I see it now!** Look at line 396 in handleSave:
```js
await setListingImages(data.id, form.images || []);
```
This is called EVERY TIME the user saves. If the user uploads 3 images (which correctly saves them to DB), then clicks Save, this line REPLACES the DB images with `form.images`. But `form.images` was updated via `setForm` in the upload handler. So it should have all 3.

**Unless the form.images format is wrong**: The upload handler sets `form.images` to `[...prev.images, ...uploadedUrls]` where uploadedUrls are strings. But `setListingImages` maps `(u) => (typeof u === 'string' ? u : u?.url)`. So strings are fine.

**I need to test this directly.** The issue might be that the upload is actually failing for 2 of the 3 files, or that the state update is not completing before the toast shows.

## Bug 2: All Sections Show Same Listings

### Root Cause: CONFIRMED
The `LocationFunnelPage.jsx` calls the tRPC endpoint directly via `fetch()` without the superjson wrapper:
```js
const url = `/api/trpc/listings.list?input=${encodeURIComponent(JSON.stringify({ locationIds }))}`;
```

But the tRPC server uses superjson transformer, which expects:
```
input={"json": {"locationIds": [30024]}}
```

Without the `{json: ...}` wrapper, the input is deserialized as `undefined`, so NO filters are applied, and ALL active listings are returned.

**Proof**: 
- Without wrapper: `?input={"locationIds":[30024]}` → returns ALL 66 listings
- With wrapper: `?input={"json":{"locationIds":[30024]}}` → returns 18 listings (correct)

### Fix
Wrap all fetch calls in LocationFunnelPage with `{json: ...}`:
- `fetchListingsByLocationIds`: `JSON.stringify({json: { locationIds }})`
- `fetchListingsByCompound`: `JSON.stringify({json: { compoundName }})`

## Bug 3: All Units Show as "New Capital"

### Root Cause: CONFIRMED
Two issues combine:

1. **PropertyCard** uses `getAreaFromListing(listing)` from `newCapitalListings.js` (line 228):
   ```js
   export function getAreaFromListing(listing) {
     if (listing.area_slug) return listing.area_slug;
     const title = listing.title || listing.title_en || listing.title_ar || '';
     const t = title.toLowerCase();
     if (t.includes('new cairo')) return 'new-cairo';
     if (t.includes('mostakbal')) return 'mostakbal-city';
     return 'new-capital'; // DEFAULT FALLBACK
   }
   ```

2. **LocationFunnelPage** returns RAW backend rows (not normalized). These rows have `areaSlug` (camelCase) but PropertyCard checks `listing.area_slug` (snake_case). Since `area_slug` is undefined on raw rows, the function falls through to the title check, and if the title doesn't contain "new cairo" or "mostakbal", it defaults to "new-capital".

3. **handleSave** in AdminListingEdit is MISSING `locationId`, `compound_name`, and `maps_url` from the row object sent to upsertListing. This means when editing a listing, these fields get lost.

### Fix
- In LocationFunnelPage: normalize the raw rows to include `area_slug` from `areaSlug`
- OR: Update `getAreaFromListing` to also check `listing.areaSlug`
- Fix handleSave to include locationId, compound_name, maps_url
