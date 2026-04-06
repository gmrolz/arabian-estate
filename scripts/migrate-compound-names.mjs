/**
 * Migration: Copy projectEn → compoundName for listings where compoundName is empty
 * Also maps areaSlug → locationId using the new locations hierarchy
 */
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Step 1: Copy projectEn → compoundName where compoundName is empty
const [updated] = await conn.execute(`
  UPDATE listings 
  SET compoundName = projectEn 
  WHERE (compoundName IS NULL OR compoundName = '') 
    AND (projectEn IS NOT NULL AND projectEn != '')
`);
console.log(`✅ Copied projectEn → compoundName for ${updated.affectedRows} listings`);

// Step 2: Map areaSlug → locationId using the locations table
// Get all Level 4 (sub-area) locations
const [areas] = await conn.execute(`SELECT id, slug, nameEn FROM locations WHERE level = 4`);
const [collections] = await conn.execute(`SELECT id, slug, nameEn FROM locations WHERE level = 3`);

// Build slug → locationId map
const slugMap = {};
for (const a of areas) {
  slugMap[a.slug] = a.id;
}
for (const c of collections) {
  slugMap[c.slug] = c.id;
}

// Common areaSlug → location slug mappings
const areaSlugToLocationSlug = {
  'new-capital': 'area-new-capital',
  'new-cairo': 'area-new-cairo',
  'mostakbal-city': 'area-mostakbal-city',
  'north-coast': 'north-coast-collection',
  'red-sea': 'red-sea-collection',
  'ain-sokhna': 'ain-sokhna-collection',
  'south-sinai': 'south-sinai-collection',
  'alexandria': 'alexandria-collection',
};

let mappedCount = 0;
for (const [areaSlug, locationSlug] of Object.entries(areaSlugToLocationSlug)) {
  const locationId = slugMap[locationSlug];
  if (!locationId) {
    console.log(`⚠️  No location found for slug: ${locationSlug}`);
    continue;
  }
  const [res] = await conn.execute(`
    UPDATE listings 
    SET locationId = ? 
    WHERE areaSlug = ? AND (locationId IS NULL OR locationId = 0)
  `, [locationId, areaSlug]);
  if (res.affectedRows > 0) {
    console.log(`  ✅ Mapped areaSlug='${areaSlug}' → locationId=${locationId} (${res.affectedRows} rows)`);
    mappedCount += res.affectedRows;
  }
}
console.log(`✅ Mapped locationId for ${mappedCount} listings`);

// Step 3: Show summary
const [rows] = await conn.execute(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN locationId IS NOT NULL AND locationId > 0 THEN 1 ELSE 0 END) as hasLocationId,
    SUM(CASE WHEN compoundName != '' AND compoundName IS NOT NULL THEN 1 ELSE 0 END) as hasCompound
  FROM listings
`);
console.log('\n📊 Summary:', rows[0]);

await conn.end();
