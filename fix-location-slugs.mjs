#!/usr/bin/env node
/**
 * Fix Location Slugs Migration
 * 
 * This script updates all listings to have the correct location slug
 * based on their locationId reference to the locations table.
 * 
 * Usage: node fix-location-slugs.mjs
 */

import { getDb } from './server/db.ts';
import { listings, locations } from './drizzle/schema.ts';
import { eq, isNotNull } from 'drizzle-orm';

async function fixLocationSlugs() {
  console.log('🔍 Starting location slug fix...\n');

  try {
    const db = await getDb();
    if (!db) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    // Get all listings with their location references
    const allListings = await db
      .select({
        id: listings.id,
        unitCode: listings.unitCode,
        currentLocation: listings.location,
        locationId: listings.locationId,
      })
      .from(listings)
      .where(isNotNull(listings.locationId));

    console.log(`📊 Found ${allListings.length} listings with locationId\n`);

    // Get all locations for reference
    const allLocations = await db.select().from(locations);
    const locationMap = new Map(allLocations.map(loc => [loc.id, loc.slug]));

    console.log(`📍 Found ${allLocations.length} locations\n`);

    // Find mismatches
    const mismatches = [];
    const updates = [];

    for (const listing of allListings) {
      const correctSlug = locationMap.get(listing.locationId);
      if (correctSlug && listing.currentLocation !== correctSlug) {
        mismatches.push({
          id: listing.id,
          unitCode: listing.unitCode,
          currentLocation: listing.currentLocation,
          correctSlug: correctSlug,
        });
        updates.push({ id: listing.id, slug: correctSlug });
      }
    }

    if (mismatches.length === 0) {
      console.log('✅ All location slugs are correct! No updates needed.\n');
      return;
    }

    console.log(`⚠️  Found ${mismatches.length} listings with incorrect location slugs:\n`);
    mismatches.forEach(m => {
      console.log(`  📌 ID: ${m.id} (${m.unitCode})`);
      console.log(`     Current: "${m.currentLocation}" → Correct: "${m.correctSlug}"\n`);
    });

    // Ask for confirmation
    console.log(`\n🔄 Updating ${mismatches.length} listings...\n`);

    // Update all mismatched listings
    for (const update of updates) {
      await db
        .update(listings)
        .set({ location: update.slug })
        .where(eq(listings.id, update.id));
    }

    console.log(`✅ Successfully updated ${mismatches.length} listings!\n`);
    console.log('📊 Summary:');
    mismatches.forEach(m => {
      console.log(`  ✓ ${m.unitCode}: "${m.currentLocation}" → "${m.correctSlug}"`);
    });

  } catch (error) {
    console.error('❌ Error fixing location slugs:', error);
    process.exit(1);
  }
}

// Run the migration
fixLocationSlugs().then(() => {
  console.log('\n✨ Location slug fix completed!\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
