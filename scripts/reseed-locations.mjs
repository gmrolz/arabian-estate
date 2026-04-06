/**
 * Reseed Levels 3, 4, and 5 of the location hierarchy.
 * Levels 1 (Governorates) and 2 (Cities) are kept intact.
 *
 * New structure:
 *   Level 3 = Collection  (e.g. East Cairo, West Cairo, North Coast, Red Sea)
 *   Level 4 = Sub-area / Neighborhood  (detailed areas within each collection)
 *   Level 5 = Compound (manual text input – NOT seeded here)
 *
 * Parent mapping (Level 2 City IDs from current DB):
 *   40 = Cairo (Governorate L1) → City L2 that covers East/West Cairo
 *   41 = Giza
 *   42 = Alexandria
 *   43 = 6th October / Sheikh Zayed area
 *   44 = Helwan / South Cairo
 *   45 = Suez
 *   54 = Matrouh (North Coast)
 *   61 = Red Sea (Hurghada etc.)
 *   62 = Hurghada
 *   63 = Sharm El-Sheikh
 *
 * We'll use the Cairo city (id=40) as parent for East/West Cairo collections.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ── Step 1: Delete old levels 3, 4, 5 ──────────────────────────────────────
console.log('Deleting old levels 3, 4, 5...');
await conn.execute('DELETE FROM locations WHERE level IN (3, 4, 5)');
console.log('Deleted.');

// ── Step 2: Get Level 2 IDs we need ────────────────────────────────────────
const [cities] = await conn.query('SELECT id, nameEn FROM locations WHERE level = 2');
const cityMap = {};
for (const c of cities) cityMap[c.nameEn] = c.id;
console.log('City map:', cityMap);

// Helper to insert and return id
async function insert(nameEn, nameAr, slug, level, parentId) {
  const [r] = await conn.execute(
    'INSERT INTO locations (nameEn, nameAr, slug, level, parentId, listingCount) VALUES (?, ?, ?, ?, ?, 0)',
    [nameEn, nameAr, slug, level, parentId]
  );
  return r.insertId;
}

// ── Step 3: Level 3 Collections ────────────────────────────────────────────
// We need to find the right parent city IDs
// Cairo = id 40, Giza = id 41, North Coast under Matrouh = 54, Red Sea = 61

// Get actual IDs from DB
const [govRows] = await conn.query('SELECT id, nameEn FROM locations WHERE level = 1');
const govMap = {};
for (const g of govRows) govMap[g.nameEn] = g.id;
console.log('Governorate map:', govMap);

// Cairo city (level 2 under Cairo governorate)
const [cairoCityRows] = await conn.query(
  'SELECT id FROM locations WHERE level = 2 AND nameEn LIKE "%Cairo%" LIMIT 1'
);
const cairoCityId = cairoCityRows[0]?.id;

// Giza city
const [gizaCityRows] = await conn.query(
  'SELECT id FROM locations WHERE level = 2 AND nameEn LIKE "%Giza%" LIMIT 1'
);
const gizaCityId = gizaCityRows[0]?.id;

// North Coast / Matrouh
const [ncCityRows] = await conn.query(
  'SELECT id FROM locations WHERE level = 2 AND (nameEn LIKE "%Matrouh%" OR nameEn LIKE "%North Coast%") LIMIT 1'
);
const ncCityId = ncCityRows[0]?.id;

// Red Sea
const [redSeaCityRows] = await conn.query(
  'SELECT id FROM locations WHERE level = 2 AND nameEn LIKE "%Red Sea%" LIMIT 1'
);
const redSeaCityId = redSeaCityRows[0]?.id;

// South Sinai (Sharm)
const [sinaiCityRows] = await conn.query(
  'SELECT id FROM locations WHERE level = 2 AND (nameEn LIKE "%Sinai%" OR nameEn LIKE "%Sharm%") LIMIT 1'
);
const sinaiCityId = sinaiCityRows[0]?.id;

// Suez / Ain Sokhna
const [suezCityRows] = await conn.query(
  'SELECT id FROM locations WHERE level = 2 AND (nameEn LIKE "%Suez%" OR nameEn LIKE "%Sokhna%") LIMIT 1'
);
const suezCityId = suezCityRows[0]?.id;

// Alexandria
const [alexCityRows] = await conn.query(
  'SELECT id FROM locations WHERE level = 2 AND nameEn LIKE "%Alexandria%" LIMIT 1'
);
const alexCityId = alexCityRows[0]?.id;

console.log({ cairoCityId, gizaCityId, ncCityId, redSeaCityId, sinaiCityId, suezCityId, alexCityId });

// ── Insert Level 3 Collections ─────────────────────────────────────────────
console.log('\nInserting Level 3 collections...');

// East Cairo (under Cairo city)
const eastCairoId = await insert('East Cairo', 'شرق القاهرة', 'east-cairo', 3, cairoCityId);
console.log('East Cairo id:', eastCairoId);

// West Cairo (under Cairo city)
const westCairoId = await insert('West Cairo', 'غرب القاهرة', 'west-cairo', 3, cairoCityId);

// South Cairo (under Cairo city)
const southCairoId = await insert('South Cairo', 'جنوب القاهرة', 'south-cairo', 3, cairoCityId);

// Giza (under Giza city)
const gizaCollId = await insert('Giza', 'الجيزة', 'giza-collection', 3, gizaCityId);

// Sheikh Zayed & 6th October (under Giza city)
const szOctId = await insert('Sheikh Zayed & 6th October', 'الشيخ زايد والسادس من أكتوبر', 'sheikh-zayed-october', 3, gizaCityId);

// North Coast (under Matrouh/North Coast city)
const northCoastId = await insert('North Coast', 'الساحل الشمالي', 'north-coast-collection', 3, ncCityId || cairoCityId);

// Alexandria (under Alexandria city)
const alexCollId = await insert('Alexandria', 'الإسكندرية', 'alexandria-collection', 3, alexCityId || cairoCityId);

// Red Sea / Hurghada (under Red Sea city)
const redSeaId = await insert('Red Sea', 'البحر الأحمر', 'red-sea-collection', 3, redSeaCityId || cairoCityId);

// South Sinai / Sharm (under Sinai city)
const southSinaiId = await insert('South Sinai', 'جنوب سيناء', 'south-sinai-collection', 3, sinaiCityId || cairoCityId);

// Ain Sokhna (under Suez city)
const sokhnaId = await insert('Ain Sokhna', 'عين السخنة', 'ain-sokhna-collection', 3, suezCityId || cairoCityId);

// Upper Egypt (generic)
const [upperEgyptCity] = await conn.query(
  'SELECT id FROM locations WHERE level = 2 AND (nameEn LIKE "%Assiut%" OR nameEn LIKE "%Upper%") LIMIT 1'
);

console.log('Level 3 collections inserted.');

// ── Insert Level 4 Sub-areas ───────────────────────────────────────────────
console.log('\nInserting Level 4 sub-areas...');

// ─── EAST CAIRO ───────────────────────────────────────────────────────────
const eastCairoAreas = [
  ['New Administrative Capital', 'العاصمة الإدارية الجديدة', 'area-new-capital'],
  ['New Cairo', 'القاهرة الجديدة', 'area-new-cairo'],
  ['Mostakbal City', 'مدينة المستقبل', 'area-mostakbal-city'],
  ['Shorouk City', 'مدينة الشروق', 'area-shorouk-city'],
  ['Badr City', 'مدينة بدر', 'area-badr-city'],
  ['Obour City', 'مدينة العبور', 'area-obour-city'],
  ['Madinaty', 'مدينتي', 'area-madinaty'],
  ['El Rehab City', 'مدينة الرحاب', 'area-el-rehab'],
  ['Katameya', 'قطاميا', 'area-katameya'],
  ['Fifth Settlement', 'التجمع الخامس', 'area-fifth-settlement'],
  ['Third Settlement', 'التجمع الثالث', 'area-third-settlement'],
  ['First Settlement', 'التجمع الأول', 'area-first-settlement'],
  ['Nasr City', 'مدينة نصر', 'area-nasr-city'],
  ['Heliopolis', 'مصر الجديدة', 'area-heliopolis'],
  ['Ain Shams', 'عين شمس', 'area-ain-shams'],
  ['Abbasiya', 'العباسية', 'area-abbasiya'],
  ['Masr El-Gedida', 'مصر القديمة', 'area-masr-el-gedida'],
];
for (const [en, ar, slug] of eastCairoAreas) {
  await insert(en, ar, slug, 4, eastCairoId);
}

// ─── WEST CAIRO ───────────────────────────────────────────────────────────
const westCairoAreas = [
  ['Zamalek', 'الزمالك', 'area-zamalek'],
  ['Dokki', 'الدقي', 'area-dokki'],
  ['Mohandessin', 'المهندسين', 'area-mohandessin'],
  ['Agouza', 'العجوزة', 'area-agouza'],
  ['Imbaba', 'إمبابة', 'area-imbaba'],
  ['Boulaq', 'بولاق', 'area-boulaq'],
  ['Downtown Cairo', 'وسط البلد', 'area-downtown-cairo'],
  ['Garden City', 'جاردن سيتي', 'area-garden-city'],
];
for (const [en, ar, slug] of westCairoAreas) {
  await insert(en, ar, slug, 4, westCairoId);
}

// ─── SOUTH CAIRO ──────────────────────────────────────────────────────────
const southCairoAreas = [
  ['Maadi', 'المعادي', 'area-maadi'],
  ['Zahraa El Maadi', 'زهراء المعادي', 'area-zahraa-el-maadi'],
  ['Degla', 'دجلة', 'area-degla'],
  ['Helwan', 'حلوان', 'area-helwan'],
  ['15th of May City', 'مدينة 15 مايو', 'area-may-city'],
  ['Katameya Heights', 'ارتفاعات قطاميا', 'area-katameya-heights'],
  ['Uptown Cairo', 'أبتاون كايرو', 'area-uptown-cairo'],
];
for (const [en, ar, slug] of southCairoAreas) {
  await insert(en, ar, slug, 4, southCairoId);
}

// ─── GIZA ─────────────────────────────────────────────────────────────────
const gizaAreas = [
  ['Giza City', 'مدينة الجيزة', 'area-giza-city'],
  ['Haram', 'الهرم', 'area-haram'],
  ['Faisal', 'فيصل', 'area-faisal'],
  ['Pyramids Area', 'منطقة الأهرامات', 'area-pyramids'],
  ['Hadayek El Ahram', 'حدائق الأهرام', 'area-hadayek-ahram'],
  ['Ard El Lewa', 'أرض اللواء', 'area-ard-el-lewa'],
];
for (const [en, ar, slug] of gizaAreas) {
  await insert(en, ar, slug, 4, gizaCollId);
}

// ─── SHEIKH ZAYED & 6TH OCTOBER ───────────────────────────────────────────
const szOctAreas = [
  ['Sheikh Zayed City', 'مدينة الشيخ زايد', 'area-sheikh-zayed-city'],
  ['Beverly Hills', 'بيفرلي هيلز', 'area-beverly-hills-sz'],
  ['Allegria', 'أليغريا', 'area-allegria'],
  ['Westown', 'ويستاون', 'area-westown'],
  ['6th October City', 'مدينة السادس من أكتوبر', 'area-sixth-october-city'],
  ['October Gardens', 'حدائق أكتوبر', 'area-october-gardens'],
  ['Hadayek October', 'حدائق أكتوبر الجديدة', 'area-hadayek-october'],
  ['Zayed Dunes', 'كثبان زايد', 'area-zayed-dunes'],
  ['Palm Hills October', 'بالم هيلز أكتوبر', 'area-palm-hills-october'],
  ['Dreamland', 'دريم لاند', 'area-dreamland'],
];
for (const [en, ar, slug] of szOctAreas) {
  await insert(en, ar, slug, 4, szOctId);
}

// ─── NORTH COAST ──────────────────────────────────────────────────────────
const northCoastAreas = [
  ['Sidi Abdel Rahman', 'سيدي عبد الرحمن', 'area-sidi-abdel-rahman'],
  ['Alamein', 'العلمين', 'area-alamein'],
  ['New Alamein', 'العلمين الجديدة', 'area-new-alamein'],
  ['Marsa Matrouh', 'مرسى مطروح', 'area-marsa-matrouh'],
  ['Ras El Hekma', 'رأس الحكمة', 'area-ras-el-hekma'],
  ['Hacienda Bay', 'هاسيندا باي', 'area-hacienda-bay'],
  ['Marassi', 'مراسي', 'area-marassi'],
  ['Sidi Heneish', 'سيدي حنيش', 'area-sidi-heneish'],
  ['Diplo', 'ديبلو', 'area-diplo'],
  ['Fouka Bay', 'فوكا باي', 'area-fouka-bay'],
  ['Amwaj', 'أمواج', 'area-amwaj'],
  ['Marina', 'مارينا', 'area-marina-nc'],
  ['Agami', 'العجمي', 'area-agami-nc'],
];
for (const [en, ar, slug] of northCoastAreas) {
  await insert(en, ar, slug, 4, northCoastId);
}

// ─── ALEXANDRIA ───────────────────────────────────────────────────────────
const alexAreas = [
  ['Smouha', 'سموحة', 'area-smouha'],
  ['Gleem', 'جليم', 'area-gleem'],
  ['San Stefano', 'سان ستيفانو', 'area-san-stefano'],
  ['Roushdy', 'روشدي', 'area-roushdy'],
  ['Mandara', 'المندرة', 'area-mandara'],
  ['Montazah', 'المنتزه', 'area-montazah'],
  ['Sidi Bishr', 'سيدي بشر', 'area-sidi-bishr'],
  ['Miami', 'ميامي', 'area-miami-alex'],
  ['Stanley', 'ستانلي', 'area-stanley'],
  ['Cleopatra', 'كليوباترا', 'area-cleopatra'],
  ['Ibrahimiya', 'إبراهيمية', 'area-ibrahimiya'],
  ['Moharam Bek', 'محرم بك', 'area-moharam-bek'],
  ['Sidi Gaber', 'سيدي جابر', 'area-sidi-gaber'],
  ['Agami', 'العجمي', 'area-agami-alex'],
  ['Borg El Arab', 'برج العرب', 'area-borg-el-arab'],
];
for (const [en, ar, slug] of alexAreas) {
  await insert(en, ar, slug, 4, alexCollId);
}

// ─── RED SEA ──────────────────────────────────────────────────────────────
const redSeaAreas = [
  ['Hurghada', 'الغردقة', 'area-hurghada'],
  ['Hurghada Downtown', 'وسط الغردقة', 'area-hurghada-downtown'],
  ['Hurghada Marina', 'مارينا الغردقة', 'area-hurghada-marina'],
  ['Sahl Hasheesh', 'سهل حشيش', 'area-sahl-hasheesh'],
  ['El Gouna', 'الجونة', 'area-el-gouna'],
  ['Makadi Bay', 'مكادي باي', 'area-makadi-bay'],
  ['Soma Bay', 'سوما باي', 'area-soma-bay'],
  ['Safaga', 'سفاجا', 'area-safaga'],
  ['El Quseir', 'القصير', 'area-el-quseir'],
  ['Marsa Alam', 'مرسى علم', 'area-marsa-alam'],
];
for (const [en, ar, slug] of redSeaAreas) {
  await insert(en, ar, slug, 4, redSeaId);
}

// ─── SOUTH SINAI ──────────────────────────────────────────────────────────
const sinaiAreas = [
  ['Sharm El-Sheikh', 'شرم الشيخ', 'area-sharm-el-sheikh'],
  ['Naama Bay', 'نعمة باي', 'area-naama-bay'],
  ['Nabq Bay', 'نبق باي', 'area-nabq-bay'],
  ['Ras Nasrani', 'رأس نصراني', 'area-ras-nasrani'],
  ['Dahab', 'دهب', 'area-dahab'],
  ['Nuweiba', 'نويبع', 'area-nuweiba'],
  ['Taba', 'طابا', 'area-taba'],
];
for (const [en, ar, slug] of sinaiAreas) {
  await insert(en, ar, slug, 4, southSinaiId);
}

// ─── AIN SOKHNA ───────────────────────────────────────────────────────────
const sokhnaAreas = [
  ['Ain Sokhna', 'عين السخنة', 'area-ain-sokhna'],
  ['Galala City', 'مدينة الجلالة', 'area-galala-city'],
  ['Zafarana', 'الزعفرانة', 'area-zafarana'],
  ['Porto Sokhna', 'بورتو السخنة', 'area-porto-sokhna'],
  ['La Vista', 'لا فيستا', 'area-la-vista-sokhna'],
  ['Mountain View Sokhna', 'ماونتن فيو السخنة', 'area-mv-sokhna'],
];
for (const [en, ar, slug] of sokhnaAreas) {
  await insert(en, ar, slug, 4, sokhnaId);
}

console.log('\n✅ All Level 3 and Level 4 locations seeded successfully!');

// Print summary
const [summary] = await conn.query(
  'SELECT level, COUNT(*) as count FROM locations GROUP BY level ORDER BY level'
);
console.log('\nLocation counts by level:');
for (const row of summary) {
  console.log(`  Level ${row.level}: ${row.count} items`);
}

await conn.end();
