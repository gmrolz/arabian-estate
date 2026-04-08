# Unified Card & Pricing System - Implementation Plan

## Problems Found

### Problem 1: Price Tag Not Showing Full Price
- **Root Cause:** The price badge on the image carousel (line 148 of PropertyCard.jsx) calls `formatPriceShort(price)` which shows abbreviated prices like "9M" instead of "9,000,000"
- **Also:** The `show_full_price` defaults to `false` in the DB schema, so full price is hidden by default on most cards

### Problem 2: Arabic and English Show Different Price Sections
- **Root Cause:** The `show_` visibility fields are stored as integers (0/1) in the database, returned as `showDownpayment: 1` (camelCase, integer) by the API, but PropertyCard expects `show_downpayment: true` (snake_case, boolean)
- The `normalizeListingRow` function does NOT map these fields. It only spreads `...row` which keeps the camelCase names
- So PropertyCard's `show_downpayment` defaults to `true` (the destructuring default), ignoring the actual DB value
- The admin preview card (ListingPreviewCard) uses its own field names directly from the form, so it works differently
- **Result:** Frontend card always shows downpayment + monthly (defaults), ignoring what admin actually set

### Problem 3: Admin Preview Card Doesn't Match Frontend Card
- **Root Cause:** Two completely separate components:
  - `PropertyCard.jsx` (frontend) - uses `useLocale()`, `t()`, `formatPriceShort()`, has carousel, WhatsApp/Call buttons
  - `ListingPreviewCard.jsx` (admin preview) - uses its own language toggle, different layout, different CSS classes, different field names
- They have different HTML structure, different CSS, different pricing logic

## Implementation Plan

### Step 1: Add show_ field mapping to normalizeListingRow
**File:** `src/lib/listingsApi.js`

Add explicit mapping for all show_ fields in normalizeListingRow:
```js
show_downpayment: row.showDownpayment === 1 || row.showDownpayment === true || row.show_downpayment === true,
show_monthly: row.showMonthly === 1 || row.showMonthly === true || row.show_monthly === true,
show_full_price: row.showFullPrice === 1 || row.showFullPrice === true || row.show_full_price === true,
show_annual: row.showAnnual === 1 || row.showAnnual === true || row.show_annual === true,
show_compound: row.showCompound === 1 || row.showCompound === true || row.show_compound === true,
annual_payment: row.annualPayment ?? row.annual_payment ?? '',
payment_years: row.paymentYears ?? row.payment_years ?? null,
payment_down_pct: row.paymentDownPct ?? row.payment_down_pct ?? null,
```

This ensures Arabic and English pages both get the same boolean values for visibility.

### Step 2: Replace ListingPreviewCard with PropertyCard in Admin
**File:** `src/pages/admin/AdminListingEdit.jsx`

Instead of using a separate `ListingPreviewCard`, use the actual `PropertyCard` component in the admin preview. This guarantees what admin sees = what frontend shows.

Changes:
- Import `PropertyCard` instead of `ListingPreviewCard`
- Wrap the admin form data through `normalizeListingRow` before passing to PropertyCard
- Keep the language toggle but apply it by wrapping PropertyCard in a locale override

### Step 3: Update PropertyCard Price Badge
**File:** `src/components/PropertyCard.jsx`

Change the price badge on the image to show the full formatted price instead of abbreviated:
- Line 148: Change `formatPriceShort(price)` to `formatNumberReadable(price)`
- Only show the badge when `show_full_price` is true

### Step 4: Fix Admin Checkboxes
**File:** `src/pages/admin/AdminListingEdit.jsx`

Ensure the admin checkboxes clearly control:
- ☑ Show Full Price (on image badge + in pricing section)
- ☑ Show Downpayment
- ☑ Show Monthly Installment
- ☑ Show Annual Payment
- If none checked → show "Ask for Price" WhatsApp button

### Step 5: Delete ListingPreviewCard
**File:** `src/components/ListingPreviewCard.jsx`

Remove the old component since it's replaced by the real PropertyCard.

## Files Changed

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/lib/listingsApi.js` | Edit | Add show_ field mapping to normalizeListingRow |
| 2 | `src/pages/admin/AdminListingEdit.jsx` | Edit | Use PropertyCard instead of ListingPreviewCard |
| 3 | `src/components/PropertyCard.jsx` | Edit | Fix price badge to show full price when enabled |
| 4 | `src/components/ListingPreviewCard.jsx` | Delete | No longer needed |
| 5 | `src/styles/listing-preview.css` | Edit | Keep admin preview wrapper styles only |

## Expected Result
- One card component used everywhere (admin preview + frontend)
- Arabic and English show identical pricing based on admin checkboxes
- Price badge shows full formatted price when "Show Full Price" is checked
- Admin can flexibly choose: full price, DP+installment, hide all, or show all 3
- What you see in admin preview = exactly what users see on frontend
