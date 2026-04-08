# Sort Order Persistence Bug - Root Cause & Fix Plan

## Root Cause Analysis

The bug occurs because of a mismatch between two different listings fetching mechanisms:

### Current Flow (Broken):
1. Admin page loads and fetches listings via `controlListings()` → stores in local `listings` state
2. User edits sort_order and clicks Save
3. `handleSave()` sends the new sort_order to server ✅ (works correctly)
4. Server saves sort_order to database ✅ (works correctly)
5. Client receives response and updates local `listings` state (line 395-402) ✅ (works correctly)
6. Client calls `refetchListings?.()` (line 403) to refresh ListingsContext
7. **BUG**: ListingsContext is refreshed, but admin page's local `listings` state is NOT refreshed
8. User navigates away or refreshes page
9. Admin page re-initializes and calls `controlListings()` again
10. **PROBLEM**: The form is initialized from the OLD listings array that was never refreshed!

### Why It Happens:
- AdminListingEdit has its own `listings` state (line 100) fetched via `controlListings()`
- It also uses `refetchListings` from ListingsContext (line 95)
- After save, only ListingsContext is refreshed, not the admin page's local listings
- When user navigates back to edit the same listing, the local listings array still has the old sort_order
- The form is initialized from this stale data

## The Fix

**Solution**: After saving, also refresh the admin page's local listings state by re-calling `controlListings()`.

### Changes Required:

**File: `src/pages/admin/AdminListingEdit.jsx`**

1. Add a function to refresh admin listings:
```javascript
const refreshAdminListings = async () => {
  const res = await controlListings(siteId);
  setListings(res.data || []);
};
```

2. In `handleSave()`, after successful save (line 393-406), add:
```javascript
if (data?.id != null) {
  // Update local listings state
  setListings((prev) => {
    const idx = prev.findIndex((l) => l.id === data.id);
    const next = [...prev];
    const updated = { ...data, images: (form.images || []).map((url) => ({ url, sort_order: 0 })) };
    if (idx >= 0) next[idx] = updated;
    else next.push(updated);
    return next;
  });
  
  // NEW: Also refresh from server to ensure all fields are in sync
  await refreshAdminListings();
  
  refetchListings?.();
  navigate(`/admin/listings/${data.id}`);
  showToast(isNew ? 'Listing added' : 'Listing saved', 'success');
}
```

### Why This Works:
- After save, we re-fetch the listing from the server via `controlListings()`
- This ensures the local listings array has the latest data including sort_order
- When user navigates away and comes back, the form will be initialized with the correct sort_order
- The data is now in sync between the server and the admin page

### Alternative (Simpler) Fix:
Instead of re-fetching all listings, we could just update the specific listing in the local array with the data returned from the server. But re-fetching is safer because it ensures all fields are correctly normalized and in sync.

## Testing Plan

1. Edit a listing and change sort_order to a new value
2. Click Save
3. Verify the toast shows "Listing saved"
4. Navigate away from the listing
5. Come back to edit the same listing
6. Verify sort_order still shows the new value (not reverted)
7. Refresh the page
8. Verify sort_order still shows the new value

## Files to Change
- `src/pages/admin/AdminListingEdit.jsx` - Add refresh logic after save
