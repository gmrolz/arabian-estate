import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [result] = await conn.execute(
  'UPDATE listings SET showFullPrice = 0, showAnnual = 0, showDownpayment = 1, showMonthly = 1'
);
console.log('Updated rows:', result.affectedRows);
await conn.end();
process.exit(0);
