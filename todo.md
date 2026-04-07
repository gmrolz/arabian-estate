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
