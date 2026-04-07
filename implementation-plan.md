# Implementation Plan: 3 Critical Bug Fixes

After a thorough code review, I have identified the root causes of all three bugs and prepared the following implementation plan.

---

## Bug 1: Multiple Image Upload Only Saves 1

### Root Cause

The upload flow works in two stages: first, each file is uploaded to S3 via `/api/upload` (one file per request, sequentially in a loop), and then the resulting URLs are persisted to the database via `setListingImages()`. The upload loop itself works correctly and collects all URLs into the `uploadedUrls` array.

However, the `setListingImages()` function calls `listings.update` which **replaces** the entire images column. The current code passes only the newly uploaded URLs, discarding any existing images. Additionally, there is a critical race condition: the `handleSave` function (line 396) also calls `setListingImages(data.id, form.images || [])` every time the user clicks Save. If the React state update from the upload handler has not completed by the time Save is triggered, the old (empty or partial) `form.images` overwrites the database.

### Implementation Plan

| Step | File | Change |
|------|------|--------|
| 1 | `src/lib/listingsApi.js` | Add a new function `appendListingImages(listingId, newUrls)` that first fetches the current listing images from the DB, merges the new URLs, then calls `listings.update` with the complete array. |
| 2 | `src/pages/admin/AdminListingEdit.jsx` | In `handleImageUpload`, replace the call to `setListingImages(listingId, uploadedUrls)` with `appendListingImages(listingId, uploadedUrls)`. This ensures existing images are preserved. |
| 3 | `src/pages/admin/AdminListingEdit.jsx` | In `handleImageUrlUpload`, apply the same change: use `appendListingImages` instead of `setListingImages`. |
| 4 | `src/pages/admin/AdminListingEdit.jsx` | After `appendListingImages` succeeds, re-fetch the listing from the DB to get the authoritative image list, then update `form.images` with that result. This eliminates stale state. |
| 5 | `src/pages/admin/AdminListingEdit.jsx` | In `handleSave` (line 396), remove the separate `setListingImages` call. Instead, include `images` in the main `upsertListing` payload so images are saved atomically with the rest of the listing data. |

### Why This Works

By fetching the current images from the DB before merging, we guarantee no images are lost. By removing the separate `setListingImages` call from `handleSave`, we eliminate the race condition where Save overwrites upload results. The single source of truth becomes the database, not React state.

---

## Bug 2: All Sections Show the Same Listings

### Root Cause (Confirmed via API Testing)

The `LocationFunnelPage.jsx` makes direct `fetch()` calls to the tRPC endpoint, but it does **not** wrap the input in the superjson format that the server expects. The tRPC server is configured with `transformer: superjson`, which requires the query input to be wrapped as `{json: {actual_input}}`.

The current code sends:
```
/api/trpc/listings.list?input={"locationIds":[30024]}
```

But the server expects:
```
/api/trpc/listings.list?input={"json":{"locationIds":[30024]}}
```

Without the `{json: ...}` wrapper, superjson deserializes the input as `undefined`, so **no filters are applied** and ALL active listings are returned. I confirmed this by testing both formats:

| Format | Result |
|--------|--------|
| Without `{json:}` wrapper | Returns **all 66 listings** (no filtering) |
| With `{json:}` wrapper | Returns **18 listings** for New Cairo (correct) |

### Implementation Plan

| Step | File | Change |
|------|------|--------|
| 1 | `src/pages/LocationFunnelPage.jsx` | In `fetchListingsByLocationIds()` (line 53), change `JSON.stringify({ locationIds })` to `JSON.stringify({ json: { locationIds } })`. |
| 2 | `src/pages/LocationFunnelPage.jsx` | In `fetchListingsByCompound()` (line 62), change `JSON.stringify({ compoundName })` to `JSON.stringify({ json: { compoundName } })`. |
| 3 | (Optional) `src/pages/LocationFunnelPage.jsx` | Consider replacing the raw `fetch()` calls with the existing `trpcQuery()` helper from `src/lib/api.js`, which already handles superjson wrapping correctly. This would prevent similar issues in the future. |

### Why This Works

Once the input is properly wrapped, the tRPC server will correctly parse the `locationIds` filter and return only listings that match the requested location. Each section/area page will then show only its own listings.

---

## Bug 3: All Units Display as "New Capital"

### Root Cause (Confirmed via Code Tracing)

This bug has two contributing causes:

**Cause A: Field name mismatch (camelCase vs snake_case)**

The `PropertyCard` component calls `getAreaFromListing(listing)` which checks `listing.area_slug` (snake_case). However, the `LocationFunnelPage` fetches raw backend rows that use `listing.areaSlug` (camelCase). Since `area_slug` is `undefined` on raw rows, the function falls through to a title-based heuristic, and if the Arabic title does not contain "new cairo" or "mostakbal", it defaults to `'new-capital'`.

The data in the database is correct:

| locationId | areaSlug | Count |
|------------|----------|-------|
| 30023 (New Capital) | `new-capital` | 42 |
| 30024 (New Cairo) | `new-cairo` | 18 |
| 30025 (Mostakbal City) | `mostakbal-city` | 4 |
| null | `new-capital` | 2 |

But the frontend never reads `areaSlug` because it only checks `area_slug`.

**Cause B: Missing fields in handleSave**

The `handleSave` function in `AdminListingEdit.jsx` does **not** include `locationId`, `compound_name`, or `maps_url` in the row object sent to `upsertListing`. This means every time a listing is edited and saved, these fields are sent as `null`/empty, potentially overwriting correct location data.

### Implementation Plan

| Step | File | Change |
|------|------|--------|
| 1 | `src/data/newCapitalListings.js` | Update `getAreaFromListing()` to also check `listing.areaSlug` (camelCase): add `if (listing.areaSlug) return listing.areaSlug;` as the second line. |
| 2 | `src/context/ListingsContext.jsx` | Update `getAreaFromListing()` (line 6) similarly to check both `areaSlug` and `area_slug`. |
| 3 | `src/pages/LocationFunnelPage.jsx` | Normalize raw backend rows before passing to `PropertyCard`. Add a simple mapping: `listing.area_slug = listing.areaSlug` for each fetched row. |
| 4 | `src/pages/admin/AdminListingEdit.jsx` | Add the missing fields to the `handleSave` row object: `locationId: form.locationId \|\| null`, `compound_name: form.compound_name \|\| ''`, `maps_url: form.maps_url \|\| ''`. |

### Why This Works

By checking both `areaSlug` and `area_slug`, the location label function will correctly identify the area regardless of whether the data comes from normalized context or raw API rows. Fixing `handleSave` ensures that location data is preserved when editing listings.

---

## Recommended Implementation Order

I recommend fixing these in the following order, as each fix is independent:

1. **Bug 2 first** (superjson wrapper) — this is a one-line fix in two places and immediately fixes the most visible issue (all sections showing the same listings).
2. **Bug 3 second** (location label) — small changes across a few files, eliminates the "New Capital" mislabeling.
3. **Bug 1 last** (image upload) — requires the most careful implementation due to the new `appendListingImages` function and race condition elimination.

Total estimated changes: approximately 6 files, with the core logic changes being relatively small and well-isolated.
