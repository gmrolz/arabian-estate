import mysql from 'mysql2/promise';

// Mapping of old areaSlug values to new location IDs
// This maps the old area_slug field to the appropriate location node
const areaSlugToLocationSlug = {
  'new-capital': '5th-settlement', // Default to 5th Settlement
  'new-cairo': 'new-cairo',
  '5th-settlement': '5th-settlement',
  'el-banafseg': 'el-banafseg',
  '6th-settlement': '6th-settlement',
  'madinaty': 'madinaty',
  'rehab-city': 'rehab-city',
  'shorouk-city': 'shorouk-city',
  'heliopolis': 'heliopolis',
  'nasr-city': 'nasr-city',
  'el-korba': 'el-korba',
  'old-cairo': 'old-cairo',
  'maadi': 'maadi',
  'zamalek': 'zamalek',
  'giza': 'giza',
  'sheikh-zayed': 'sheikh-zayed',
  '6th-october': '6th-october',
  'mohandessin': 'mohandessin',
  'dokki': 'dokki',
  'new-giza': 'new-giza',
  'alexandria': 'alexandria',
  'hay-shark': 'hay-shark',
  'montazah': 'montazah',
  'laurent': 'laurent',
  'north-coast': 'north-coast',
  'el-alamein': 'el-alamein',
  'sidi-abd-el-rahman': 'sidi-abd-el-rahman',
  'ras-el-hekma': 'ras-el-hekma',
  'new-alamein': 'new-alamein',
  'red-sea': 'red-sea',
  'hurghada': 'hurghada',
  'sahl-hasheesh': 'sahl-hasheesh',
  'makadi': 'makadi',
  'el-gouna': 'el-gouna',
};

async function migrateListingsToLocations() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Parse DATABASE_URL
  const url = new URL(process.env.DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    port: parseInt(url.port || '3306'),
    ssl: { rejectUnauthorized: false },
  });

  console.log('Starting migration of listings to new location system...\n');

  try {
    // Step 1: Add locationId column to listings if it doesn't exist
    console.log('Step 1: Checking listings table structure...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'listings' AND COLUMN_NAME = 'locationId'
    `);

    if (columns.length === 0) {
      console.log('  Adding locationId column to listings table...');
      await connection.execute(`
        ALTER TABLE listings ADD COLUMN locationId INT AFTER areaSlug
      `);
      console.log('  ✓ locationId column added\n');
    } else {
      console.log('  ✓ locationId column already exists\n');
    }

    // Step 2: Get all unique area slugs from listings
    console.log('Step 2: Analyzing existing listings...');
    const [listings] = await connection.query(`
      SELECT DISTINCT areaSlug FROM listings WHERE areaSlug IS NOT NULL
    `);

    console.log(`  Found ${listings.length} unique area slugs\n`);

    // Step 3: Map each area slug to location ID and update listings
    console.log('Step 3: Mapping listings to locations...');
    let updatedCount = 0;
    let unmappedSlugs = new Set();

    for (const { areaSlug } of listings) {
      const locationSlug = areaSlugToLocationSlug[areaSlug];

      if (!locationSlug) {
        unmappedSlugs.add(areaSlug);
        console.log(`  ⚠ No mapping for area slug: ${areaSlug}`);
        continue;
      }

      // Get location ID from slug
      const [locations] = await connection.query(
        'SELECT id FROM locations WHERE slug = ?',
        [locationSlug]
      );

      if (locations.length === 0) {
        console.log(`  ⚠ Location not found for slug: ${locationSlug}`);
        continue;
      }

      const locationId = locations[0].id;

      // Update all listings with this area slug
      const [result] = await connection.execute(
        'UPDATE listings SET locationId = ? WHERE areaSlug = ?',
        [locationId, areaSlug]
      );

      updatedCount += result.affectedRows;
      console.log(`  ✓ Mapped ${areaSlug} → ${locationSlug} (ID: ${locationId}) - ${result.affectedRows} listings updated`);
    }

    console.log(`\n  Total listings updated: ${updatedCount}\n`);

    if (unmappedSlugs.size > 0) {
      console.log(`⚠ Warning: ${unmappedSlugs.size} area slugs could not be mapped:`);
      unmappedSlugs.forEach((slug) => console.log(`  - ${slug}`));
      console.log();
    }

    // Step 4: Verify migration
    console.log('Step 4: Verifying migration...');
    const [verifyResult] = await connection.query(`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(CASE WHEN locationId IS NOT NULL THEN 1 END) as mapped_listings,
        COUNT(CASE WHEN locationId IS NULL THEN 1 END) as unmapped_listings
      FROM listings
    `);

    const { total_listings, mapped_listings, unmapped_listings } = verifyResult[0];
    console.log(`  Total listings: ${total_listings}`);
    console.log(`  Mapped listings: ${mapped_listings}`);
    console.log(`  Unmapped listings: ${unmapped_listings}`);

    if (unmapped_listings > 0) {
      console.log(`\n  ⚠ ${unmapped_listings} listings are still unmapped. These may need manual assignment.\n`);
    }

    // Step 5: Update listing_count in locations table
    console.log('Step 5: Updating listing counts in locations table...');
    await connection.execute(`
      UPDATE locations l
      SET listingCount = (
        SELECT COUNT(*) FROM listings WHERE locationId = l.id
      )
    `);
    console.log('  ✓ Listing counts updated\n');

    // Step 6: Show statistics by location
    console.log('Step 6: Listing distribution by location:');
    const [distribution] = await connection.query(`
      SELECT 
        l.id,
        l.nameEn,
        l.nameAr,
        l.level,
        l.slug,
        COUNT(li.id) as listing_count
      FROM locations l
      LEFT JOIN listings li ON li.locationId = l.id
      WHERE l.level IN (1, 2, 3, 5)
      GROUP BY l.id
      HAVING listing_count > 0
      ORDER BY l.level, listing_count DESC
    `);

    distribution.forEach((row) => {
      const levelNames = { 1: 'Governorate', 2: 'City', 3: 'District', 5: 'Compound' };
      console.log(`  ${levelNames[row.level]}: ${row.nameEn} (${row.listing_count} listings)`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrateListingsToLocations();
