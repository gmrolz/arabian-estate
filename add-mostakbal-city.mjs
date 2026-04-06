import mysql from 'mysql2/promise';

async function addMostakbalCity() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const url = new URL(process.env.DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    port: parseInt(url.port || '3306'),
    ssl: { rejectUnauthorized: false },
  });

  console.log('Adding Mostakbal City to locations...');

  try {
    // Insert Mostakbal City as a District under New Cairo (ID: 2)
    const [result] = await connection.execute(
      `INSERT INTO locations (nameAr, nameEn, slug, level, parentId, listingCount) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      ['مدينة المستقبل', 'Mostakbal City', 'mostakbal-city', 3, 2]
    );

    const mostakbalId = result.insertId;
    console.log(`✓ Mostakbal City added with ID: ${mostakbalId}\n`);

    // Update listings with mostakbal-city area slug
    const [updateResult] = await connection.execute(
      'UPDATE listings SET locationId = ? WHERE areaSlug = ?',
      [mostakbalId, 'mostakbal-city']
    );

    console.log(`✓ ${updateResult.affectedRows} listings remapped to Mostakbal City\n`);

    // Update listing count for Mostakbal City
    await connection.execute(
      'UPDATE locations SET listingCount = (SELECT COUNT(*) FROM listings WHERE locationId = ?) WHERE id = ?',
      [mostakbalId, mostakbalId]
    );

    // Verify
    const [verify] = await connection.query(`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(CASE WHEN locationId IS NOT NULL THEN 1 END) as mapped_listings,
        COUNT(CASE WHEN locationId IS NULL THEN 1 END) as unmapped_listings
      FROM listings
    `);

    const { total_listings, mapped_listings, unmapped_listings } = verify[0];
    console.log('Final verification:');
    console.log(`  Total listings: ${total_listings}`);
    console.log(`  Mapped listings: ${mapped_listings}`);
    console.log(`  Unmapped listings: ${unmapped_listings}`);

    if (unmapped_listings === 0) {
      console.log('\n✅ All listings are now mapped!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addMostakbalCity();
