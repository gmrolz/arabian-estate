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

## Location System Refactoring (Pattern A)

- [x] Create locations table schema with 5-level hierarchy
- [x] Seed Egypt location hierarchy (Governorate → City → District → Sub-area → Compound)
- [x] Create migration script to map existing listings to new location nodes
- [x] Implement Pattern A URL routing: /[lang]/[intent]/[governorate]/[property-type]-[intent][-area-slug].html
- [x] Create location search API endpoint with autocomplete
- [ ] Add breadcrumb generation logic for listing pages (deferred)
- [ ] Add filter chips UI for location drilling (deferred)
- [x] Test and verify location search API endpoints

## Frontend Integration (Location System)

- [ ] Create location tree component to display hierarchy
- [ ] Update listing context to use locationId instead of areaSlug
- [ ] Add location filtering to listing pages
- [ ] Test and verify location system works end-to-end
- [x] Add location management to admin dashboard (view, edit, add locations)
