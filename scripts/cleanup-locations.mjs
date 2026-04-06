import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Remove Abbasiya, Ain Shams, Masr El-Gedida from Level 4
console.log('Removing Abbasiya, Ain Shams, Masr El-Gedida...');
const [del1] = await conn.execute(
  "DELETE FROM locations WHERE level = 4 AND nameEn IN ('Abbasiya', 'Ain Shams', 'Masr El-Gedida')"
);
console.log(`Deleted ${del1.affectedRows} rows`);

// 2. Add Sixth Settlement under East Cairo (find East Cairo id)
const [ecRows] = await conn.query("SELECT id FROM locations WHERE level = 3 AND nameEn = 'East Cairo' LIMIT 1");
const eastCairoId = ecRows[0]?.id;
console.log('East Cairo id:', eastCairoId);

if (eastCairoId) {
  const [ins] = await conn.execute(
    "INSERT INTO locations (nameEn, nameAr, slug, level, parentId, listingCount) VALUES (?, ?, ?, 4, ?, 0)",
    ['Sixth Settlement', 'التجمع السادس', 'area-sixth-settlement', eastCairoId]
  );
  console.log('Added Sixth Settlement, id:', ins.insertId);
}

// 3. Show final East Cairo neighborhoods
const [ecAreas] = await conn.query(
  "SELECT id, nameEn, nameAr FROM locations WHERE level = 4 AND parentId = ? ORDER BY nameEn",
  [eastCairoId]
);
console.log('\nEast Cairo neighborhoods now:');
for (const a of ecAreas) console.log(' -', a.nameEn, '/', a.nameAr);

// 4. Summary
const [summary] = await conn.query('SELECT level, COUNT(*) as count FROM locations GROUP BY level ORDER BY level');
console.log('\nLocation counts by level:');
for (const r of summary) console.log(`  Level ${r.level}: ${r.count} items`);

await conn.end();
