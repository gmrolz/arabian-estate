import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query('SELECT id, nameEn, nameAr, level, parentId FROM locations ORDER BY level, id LIMIT 100');
console.log(JSON.stringify(rows, null, 2));
await conn.end();
