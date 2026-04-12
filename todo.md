# Arabian Estate - Project TODO

- [x] Design database schema for listings table
- [x] Create backend tRPC API routes for listings CRUD (list, getById, create, update, delete)
- [x] Seed the database with the 27 existing static listings
- [x] Update frontend to fetch listings from the new API instead of static data
- [x] Update admin panel to use the new API for CRUD operations
- [x] Remove old Supabase/Google Sheets/VPS code
- [x] Fix duplicate language bars (removed fixed ListingLangBar from App.jsx, kept inline ones in pages)
- [x] Fix English translations to properly match Arabic titles (already correct)
- [x] Upload listing images to S3 storage and update image URLs (using Manus storagePut)
- [x] Write vitest tests for the API routes (11 tests passing)
- [x] Auto-detect browser language and redirect (Arabic default, English for non-Arabic browsers)
- [x] Upgrade filter CSS to modern luxury design with collapsible mobile view
- [x] Update Arabic brand name to ارابيان استيت
- [x] Force admin panel to English LTR layout
- [x] Combine New Capital + New Cairo + Mostakbal City into single East Cairo page
- [x] Add image upload endpoint using Manus storage helpers
- [x] Save checkpoint and deliver to user
- [x] Fix deployment: add react-router-dom and other missing frontend dependencies
- [x] Update main CTA phone/WhatsApp number to 01000257941
- [x] Fix monthly payment not showing on property cards (variable name mismatch: monthlyInst vs monthly_inst)
- [x] Add Google Tag Manager (GTM-N7LMGM56) across entire website
- [x] Fix image upload in Add New Listing form (updated to support FileList)
- [x] Add support for multiple image uploads in Add New Listing form
- [x] Update database schema: add annual_payment, show_price, show_monthly, show_downpayment, show_full_price, show_compound fields
- [x] Update admin form: change downpayment starting from 1.5%, increase year options, add annual payment input
- [x] Add pricing visibility checkboxes: show/hide Pay Now, Monthly, Full Price, Full Price
- [x] Add compound visibility checkbox to admin form
- [x] Update PropertyCard to respect visibility settings and show WhatsApp button for hidden prices
- [x] Add live preview card to admin form (desktop: side panel, mobile: sidebar button)
- [x] Update payment plan calculator: support 0% downpayment and annual payment calculations
- [x] Improve live preview: show mobile-sized card (375px), add Arabic/English toggle, show multiple cards in list view
- [x] Add inline visibility checkboxes next to each pricing field (price, downpayment, monthly, annual)
- [x] Remove redundant "What to show on frontend" section from admin form
- [x] Add URL image upload feature (download from URL and upload to S3)
- [x] Sync admin preview card with frontend pricing visibility logic
- [x] Set default visibility: Pay Now + Monthly checked, Full Price + Annual unchecked for all cards

## Location System Refactoring (Pattern A)

- [x] Create locations table schema with 5-level hierarchy
- [x] Seed Egypt location hierarchy (Governorate → City → District → Sub-area → Compound)
- [x] Create migration script to map existing listings to new location nodes
- [x] Implement Pattern A URL routing: /[lang]/[intent]/[governorate]/[property-type]-[intent][-area-slug].html
- [x] Create location search API endpoint with autocomplete
- [ ] Add breadcrumb generation logic for listing pages (deferred)
- [ ] Add filter chips UI for location drilling (deferred)
- [x] Test and verify location search API endpoints

## Frontend Integration (Location System) - COMPLETE

- [x] Create LocationTree component for hierarchical display (levels 1-5 with expand/collapse)
- [x] Update ListingsContext to read/write locationId with backward-compatible areaSlug fallback
- [x] Implement location filtering UI on listing pages (search/tree selection)
- [x] Resolve Drizzle schema migration state for locationId column (FIXED)
- [x] End-to-end test: admin create listing with locationId -> persist -> display on frontend

## Compound Management System
- [ ] Create admin compounds management page with autocomplete search
- [ ] Add compound search and create API endpoints
- [ ] Integrate compound selector into listing form with autocomplete
- [ ] Test and verify compound management works end-to-end

## Location Hierarchy Cascading Dropdowns
- [x] Create CascadingLocationSelector component (4 dropdowns + manual compound input)
- [x] Add compoundName field to DB schema and run migration
- [x] Update listingsRouter to accept locationId and compoundName
- [x] Update listingsApi.js to pass locationId and compoundName
- [x] Replace old LocationSelector with CascadingLocationSelector in admin form

## Location Hierarchy Rebuild
- [ ] Clear old location data and reseed with correct Egyptian real estate regions
- [ ] Level 1: Regions (East Cairo, West Cairo, North Coast, Red Sea, etc.)
- [ ] Level 2: Areas (New Cairo, New Capital, Mostakbal, Shorouk, etc.)
- [ ] Level 3: Sub-areas / Neighborhoods (all detailed areas from previous chat)
- [ ] Update CascadingLocationSelector labels to match new structure

## UI Improvements
- [x] Make admin sitemap collapsible (cities/collections expand/collapse)
- [x] Add AI-generated brand placeholder image for listings without photos
- [ ] Generate unique AI images for each location section card (no duplicates)

## Location Funnel Pages (Google Ads)
- [ ] Dynamic routes: /listings/:citySlug, /listings/:citySlug/:collectionSlug, /listings/:citySlug/:collectionSlug/:neighborhoodSlug, /listings/:citySlug/:collectionSlug/:neighborhoodSlug/:compoundSlug
- [ ] CityPage component with collection cards + breadcrumbs
- [ ] CollectionPage component with neighborhood cards + breadcrumbs
- [ ] NeighborhoodPage component with compound cards + listings + breadcrumbs
- [ ] CompoundPage component with all listings for that compound + breadcrumbs
- [ ] Location API endpoints: get by slug, get children by parent slug
- [ ] Update homepage CitiesSection to link into new funnel
- [ ] SEO meta tags (title, description, og:tags) per page level

## PropertyFinder-Style Funnel UX
- [x] Homepage: show Cairo with East Cairo as featured sub-section with nested cards
- [x] LocationFunnelPage: breadcrumbs + sub-location chips with counts + quick filters + listings grid
- [x] Chips row: single line with Show More / See Less toggle
- [x] Fix chips bar: expand downward to show all hidden chips below first row
- [x] Hide chips and section cards with 0 listings from funnel pages and homepage
- [x] Fix image upload from computer not working on Add Listing (only works in Edit) - auto-save listing first
- [x] Fix multiple image selection - only uploads one instead of all selected - fixed stale state issue

## Bug Fixes (Reported by user)
- [x] BUG: Multiple image upload still only saves 1 image - FIXED: created appendListingImages() that merges with existing images
- [x] BUG: All sections/pages show same listings - FIXED: added superjson {json: {...}} wrapper to LocationFunnelPage tRPC calls
- [x] BUG: All units display as "New Capital" even in New Cairo section - FIXED: added areaSlug check to getAreaFromListing() and missing fields to handleSave
- [x] BUG: Multiple image upload STILL only saves 1 image - FIXED: implemented bulk upload endpoint with parallel S3 uploads
- [x] BUG: Frontend titles not appearing on listings - FIXED: created shared normalizeListingRow() and applied to LocationFunnelPage
- [x] FEATURE: Add unit_type field to database schema - Already exists in DB
- [x] FEATURE: Add unit_type selector to admin form - Added dropdown with 7 options
- [x] FEATURE: Display unit_type on frontend listing cards - Shows in PropertyCard specs
- [x] FEATURE: Migrate existing units to have unit_type values - All units already have unitType from DB
- [x] FEATURE: Add I Villa, Z Villa, Q Villa to unit_type selector - Added to AdminListingEdit dropdown
- [x] BUG: Fix Arabic titles showing in English - Fixed LocationFunnelPage to pass actual locale to normalization
- [x] FEATURE: Ensure villa types display correctly on frontend PropertyCard - Already displays via unit_type field
- [x] BUG: Title showing only in Arabic - FIXED: Removed incorrect locale.replace() in LocationFunnelPage and added locale to dependency array
- [x] BUG: Admin page mobile - eye icon covers save button when editing - FIXED: Moved preview button from bottom 24px to 120px
- [x] FEATURE: Add "Duplex" to unit_type selector in admin form - Added to dropdown options
- [x] FEATURE: Ensure Duplex displays correctly on frontend PropertyCard - Displays via unit_type field
- [x] BUG: Compound name not persisting - FIXED: Added field mapping from camelCase compoundName to snake_case compound_name
- [x] BUG: Sort order changes not persisting - FIXED: Added admin listings refresh after save to keep data in sync
- [x] BUG: Image deletion in edit mode not working - FIXED: Added images array to handleSave row object
- [x] FEATURE: Add image reordering - ALREADY IMPLEMENTED: moveImage function with up/down buttons
- [x] BUG: Image reordering not persisting - FIXED: Removed incorrect sort_order extraction that was losing image order
- [x] FEATURE: Auto-save and notify when image is deleted - Implemented with success notification
- [x] FEATURE: Auto-save and notify when image order is changed - Implemented with success notification

## Unified Card & Pricing System
- [x] BUG: Price tag not showing full price on frontend card - FIXED: Updated ImageCarousel to show full formatted price when show_full_price is true
- [x] BUG: Arabic and English showing different price sections - not linked - FIXED: Added show_ field mapping to normalizeListingRow
- [x] BUG: Admin preview card doesn't match frontend card - FIXED: Replaced ListingPreviewCard with PropertyCard in AdminListingEdit
- [x] FEATURE: Unified PropertyCard with flexible pricing display (full price, DP+installment, hide price, or all 3) - COMPLETE
- [x] FEATURE: Admin checkboxes to control which price elements to show on card - COMPLETE
- [x] FEATURE: Admin preview card must match frontend card exactly - COMPLETE: Uses real PropertyCard component

## Pricing Visibility - Database-Driven Control
- [x] Verify show_full_price, show_downpayment, show_monthly, show_annual columns exist in DB schema - CONFIRMED: All columns exist in drizzle/schema.ts
- [x] Update admin backend (buildListingRow / handleSave) to persist visibility flags to DB - DONE: Added to buildListingRow, handleSave, and upsertListing
- [x] Update admin form to load visibility flags from DB when editing existing listing - DONE: Added to controlListings mapping and form initialization
- [x] Update frontend PropertyCard to read and respect DB flags (show/hide full price, DP, monthly, annual) - DONE: Added to normalizeRow and normalizeListingRow
- [x] Ensure admin preview card is synced with actual card behavior - DONE: Uses real PropertyCard component
- [x] Test full flow: admin toggle → DB save → frontend display - DONE: 7 vitest tests passing
- [x] Update server listingsRouter: Added visibility fields to create/update Zod schemas, formatRow, and create mutation
- [x] Update server listingsRouter: Added boolean-to-int conversion for visibility fields in update mutation

## Price Badge Display
- [x] BUG: Price badge on image should show short format (8.8M) not full format (9,000,000) - FIXED: Changed badge to use formatPriceShort()
- [x] FEATURE: Full price row should keep full format (9,000,000) for clarity - DONE: Full price row uses formatNumberReadable()


## SEO Fixes - Homepage
- [x] BUG: No keywords detected on homepage - FIXED: Added meta keywords tag with real estate, apartments, villas, New Capital, Egypt, luxury properties, investment
- [x] BUG: Page title too short (14 chars) - FIXED: Updated to "Arabian Estate - Premium Real Estate Egypt" (43 characters)
- [x] BUG: 6 images missing alt text on homepage - FIXED: Added alt text to 5 flag images in Header.jsx and ListingLangBar.jsx (English, العربية)


## Lead Tracking & Inquiry Enhancement
- [x] FEATURE: Show listing ID in admin listings table (before edit button) for lead tracking - DONE: Added ID badge in admin-listing-card-actions
- [x] FEATURE: Enhance WhatsApp inquiry message with detailed pricing (full price, DP, monthly, duration) - DONE: Added Listing ID, pricing details, payment duration calculation, and annual payment option to WhatsApp message

- [x] BUG: PropertyCard showing map and hiding prices - FIXED: Rolled back to checkpoint 6e13e3f3 to restore old card layout with prices visible
- [x] BUG: Cards showing "Ask for Price" instead of pricing - FIXED: Added default behavior in PropertyCard so show_price defaults to true

## Card UI Improvements
- [x] FEATURE: Improve "card.payNow" text label to something more descriptive - DONE: Changed to "Down Payment" (EN) and "المقدم" (AR)
- [x] FEATURE: Remove Map button from property card for now - DONE: Removed Map button, GoogleMapsModal import, and mapOpen state
- [x] FEATURE: Add fullPrice translation - DONE: Added "Full Price" (EN) and "السعر الكامل" (AR)


## Card Display Issues
- [ ] BUG: Carousel/image slider not appearing on property cards
- [ ] BUG: Card height varies based on pricing content - should be consistent
- [ ] BUG: WhatsApp button position varies on each card - should be at same location
