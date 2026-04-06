import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query(
  'SELECT id, nameEn, nameAr, level, parentId FROM locations ORDER BY level, parentId, id'
);

// Group by level
const byLevel = { 1: [], 2: [], 3: [], 4: [], 5: [] };
for (const r of rows) byLevel[r.level]?.push(r);

for (const [lvl, items] of Object.entries(byLevel)) {
  console.log(`\n=== LEVEL ${lvl} (${items.length} items) ===`);
  for (const i of items) {
    console.log(`  [${i.id}] parentId=${i.parentId} | ${i.nameEn} / ${i.nameAr}`);
  }
}

await conn.end();
