import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse CSV manually
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',').map(v => v.trim());
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    records.push(record);
  }

  return records;
}

async function seedLocations() {
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, 'locations-data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parseCSV(csvContent);

    console.log(`Parsed ${records.length} location records from CSV`);

    // Build SQL statements
    let sql = 'DELETE FROM locations;\n';

    const locationMap = new Map();
    locationMap.set(null, null);

    for (const record of records) {
      const { name_en, name_ar, slug, level, parent_slug } = record;

      if (!name_en || !name_ar || !slug || !level) {
        console.warn(`Skipping incomplete record: ${JSON.stringify(record)}`);
        continue;
      }

      const levelNum = Number(level);

      // Escape single quotes in names
      const escapedNameEn = name_en.replace(/'/g, "''");
      const escapedNameAr = name_ar.replace(/'/g, "''");
      const parentId = parent_slug ? `(SELECT id FROM locations WHERE slug = '${parent_slug}')` : 'NULL';

      sql += `INSERT INTO locations (nameEn, nameAr, slug, level, parentId) VALUES ('${escapedNameEn}', '${escapedNameAr}', '${slug}', ${levelNum}, ${parentId});\n`;
    }

    // Write SQL to temp file
    const sqlPath = path.join(__dirname, 'seed-locations.sql');
    fs.writeFileSync(sqlPath, sql);

    console.log(`Generated SQL file: ${sqlPath}`);
    console.log(`Total insert statements: ${sql.split('INSERT').length - 1}`);
    console.log(`First few SQL statements:\n${sql.split('\n').slice(0, 5).join('\n')}`);

    // Execute SQL via mysql CLI
    const urlParts = new URL(DATABASE_URL);
    const host = urlParts.hostname;
    const user = urlParts.username;
    const password = urlParts.password;
    const database = urlParts.pathname.slice(1);
    const port = urlParts.port || 3306;

    const mysqlCmd = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < ${sqlPath}`;

    console.log(`Executing SQL...\nCommand: ${mysqlCmd.replace(password, '****')}`);
    await new Promise((resolve, reject) => {
      const proc = spawn('sh', ['-c', mysqlCmd], { stdio: 'inherit' });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`MySQL exited with code ${code}`));
      });
    });

    console.log('✅ Successfully seeded locations from CSV');
    console.log(`\nVerify by running: mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} -e "SELECT level, COUNT(*) FROM locations GROUP BY level;"`);
  } catch (error) {
    console.error('Error seeding locations:', error.message);
    process.exit(1);
  }
}

seedLocations();
