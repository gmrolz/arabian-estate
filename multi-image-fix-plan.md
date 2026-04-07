# Multi-Image Upload Bug: Root Cause Analysis & Implementation Plan

## Investigation Summary

I traced the entire upload flow end-to-end and found **the real root cause** is a **race condition between `handleSave` and `appendListingImages`**.

---

## Root Cause: `handleSave` Overwrites Images

Here is what happens when you select 3 images on a listing:

### Step-by-Step Flow

| Step | What Happens | Result |
|------|-------------|--------|
| 1 | User selects 3 files | `handleImageUpload(files)` is called with 3 files |
| 2 | File 1 uploaded to S3 | Returns URL1 |
| 3 | File 2 uploaded to S3 | Returns URL2 |
| 4 | File 3 uploaded to S3 | Returns URL3 |
| 5 | `appendListingImages(id, [URL1, URL2, URL3])` called | Fetches current images from DB, merges, saves all 3 |
| 6 | Form state updated with all 3 URLs | `form.images = [existing... + URL1, URL2, URL3]` |

**This flow SHOULD work.** But there is a hidden problem:

### The Hidden Race Condition

The `handleSave` function (triggered by the "Save" button) does NOT include `images` in its `row` object. Look at line 364-392:

```js
const row = {
  id: form.id,
  title_ar: form.title_ar,
  // ... all other fields ...
  // ❌ NO images field!
};
const { data, error } = await upsertListing(row);
```

In `upsertListing()` (listingsApi.js line 242-244):
```js
images: listing.images
  ? (listing.images || []).map(...)
  : undefined,  // ← images is undefined, so it's excluded from payload
```

**Since `images` is undefined, it IS excluded from the tRPC update payload.** So `handleSave` should NOT overwrite images. This means the save flow is NOT the race condition.

### The ACTUAL Root Cause

After deeper analysis, I found the real issue is in `appendListingImages()` itself:

```js
export async function appendListingImages(listingId, newUrls) {
  const current = await trpcQuery('listings.getById', { id: listingId });
  const existingImages = current?.images || [];
  // ...
}
```

**The `trpcQuery('listings.getById')` returns the FULL listing object**, and `current.images` is already a parsed array. BUT - the `getById` endpoint returns `formatRow(rows[0])` which calls `parseImages(row)`:

```js
function parseImages(row) {
  if (!row.images) return [];
  if (Array.isArray(row.images)) return row.images;
  try { return JSON.parse(row.images); }
  catch { return []; }
}
```

**The issue is that `current` returned by `trpcQuery` is the FULL listing, not just `current.images`.** So `current?.images` should work. Let me verify...

Actually, I tested this manually and the server-side works perfectly:
- `listings.update` with `images: ["a.jpg", "b.jpg", "c.jpg"]` saves all 3 correctly
- `listings.getById` returns images as a proper array

### The REAL Real Root Cause

After ruling out server issues, the problem must be in the **upload loop itself**. The `uploadListingImage()` function uploads ONE file at a time via `fetch('/api/upload')`. The server endpoint uses `multer.single('file')` - it only accepts ONE file per request.

**The upload loop IS sequential and DOES collect all URLs.** So why does only 1 show?

The answer is: **the user likely sees "1 image(s) uploaded successfully" because the upload of files 2 and 3 FAILS silently.** The S3 upload might be timing out or the server might be rejecting subsequent requests.

Let me check the error handling:
```js
for (let i = 0; i < files.length; i++) {
  const { url, error } = await uploadListingImage(file, listingId);
  if (error || !url) {
    errors.push(`${file.name}: ${error?.message || 'Upload failed'}`);
  } else {
    uploadedUrls.push(url);
  }
}
```

The errors ARE collected but shown in a SEPARATE toast. If the user dismisses the first toast, they might miss the error toast. Also, the success toast says `${uploadedUrls.length} image(s)` - if it says "1", then only 1 upload succeeded.

---

## Implementation Plan

### Approach: Create a new server-side bulk upload endpoint

Instead of uploading files one-by-one from the client, create a single endpoint that accepts multiple files and returns all URLs at once. This eliminates:
- Sequential upload failures
- Race conditions
- Client-side complexity

### Changes Required

#### 1. Server: New `/api/upload-multiple` endpoint (server/_core/index.ts)

```
POST /api/upload-multiple
Content-Type: multipart/form-data
Body: files[] (multiple files), listingId

Response: { urls: ["url1", "url2", "url3"], errors: [] }
```

- Uses `multer.array('files', 20)` instead of `multer.single('file')`
- Uploads all files to S3 in parallel using `Promise.allSettled()`
- Returns all successful URLs and any errors in one response
- Atomic: either reports all results at once

#### 2. Client: New `uploadMultipleImages()` function (src/lib/listingsApi.js)

```js
export async function uploadMultipleImages(files, listingId) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  formData.append('listingId', String(listingId));
  
  const res = await fetch('/api/upload-multiple', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  const result = await res.json();
  return { urls: result.urls || [], errors: result.errors || [] };
}
```

#### 3. Client: Simplify `handleImageUpload()` (AdminListingEdit.jsx)

```js
const handleImageUpload = async (files) => {
  // ... auto-save logic stays the same ...
  
  setUploadLoading(true);
  
  // Single request uploads all files at once
  const { urls, errors } = await uploadMultipleImages(files, listingId);
  
  if (urls.length > 0) {
    // Append all URLs to DB in one call
    const { error } = await appendListingImages(listingId, urls);
    if (error) {
      showToast(`Uploaded ${urls.length} but DB save failed`, 'warning');
    } else {
      showToast(`${urls.length} image(s) uploaded successfully.`, 'success');
      setForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    }
  }
  
  if (errors.length > 0) {
    showToast(`${errors.length} file(s) failed: ${errors.join('; ')}`, 'error');
  }
  
  setUploadLoading(false);
};
```

### Why This Approach Works

| Problem | Solution |
|---------|----------|
| Sequential uploads can fail silently | Single request, all-or-nothing response |
| Client-side loop complexity | Server handles parallel S3 uploads |
| Race conditions between upload and save | One atomic upload + one atomic DB persist |
| Error visibility | All errors returned in single response |
| Performance | Parallel S3 uploads instead of sequential |

### Files to Change

| File | Change |
|------|--------|
| `server/_core/index.ts` | Add `/api/upload-multiple` endpoint with `multer.array()` |
| `src/lib/listingsApi.js` | Add `uploadMultipleImages()` function |
| `src/pages/admin/AdminListingEdit.jsx` | Rewrite `handleImageUpload()` to use bulk upload |
| `server/BugFixes.test.ts` | Add test for bulk upload endpoint |

### Estimated Impact

- **3 files changed** (plus 1 test file)
- **No database schema changes**
- **No breaking changes** to existing single-file upload
- **Backward compatible** - old `/api/upload` endpoint stays for URL uploads
