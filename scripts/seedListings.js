/**
 * Seed Supabase with the 23 static listings from newCapitalListings.js
 * Run from react-site: npm run seed
 * Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { newCapitalListings } from '../src/data/newCapitalListings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Create react-site/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).');
  process.exit(1);
}

const supabase = createClient(url, key);

function getAreaSlug(listing) {
  const t = (listing.title || '').toLowerCase();
  return t.includes('new cairo') ? 'new-cairo' : 'new-capital';
}

function rowFromListing(listing, sortOrder) {
  return {
    unit_code: String(listing.unitCode ?? listing.id ?? ''),
    title_ar: null,
    title_en: listing.title || '',
    developer_ar: null,
    developer_en: listing.developer || '',
    project_ar: null,
    project_en: listing.project || '',
    location: listing.location || '',
    unit_type: listing.unitType || 'Apartment',
    area: listing.area ?? 0,
    rooms: listing.rooms ?? 0,
    toilets: listing.toilets ?? 0,
    downpayment: listing.downpayment || '',
    monthly_inst: listing.monthlyInst || '',
    price: listing.price || '',
    finishing: listing.finishing || '',
    delivery: listing.delivery || '',
    featured: !!listing.featured,
    area_slug: getAreaSlug(listing),
    sort_order: sortOrder,
  };
}

async function main() {
  const existing = await supabase.from('arabian_estate_listings').select('id').limit(1);
  if (existing.data && existing.data.length > 0) {
    console.log('Listings already exist. Clear table first if you want to re-seed.');
    process.exit(0);
  }

  for (let i = 0; i < newCapitalListings.length; i++) {
    const listing = newCapitalListings[i];
    const row = rowFromListing(listing, i + 1);
    const { data: inserted, error } = await supabase.from('arabian_estate_listings').insert(row).select('id').single();
    if (error) {
      console.error('Insert listing error:', error);
      process.exit(1);
    }
    const listingId = inserted.id;
    const images = listing.images || [];
    for (let j = 0; j < images.length; j++) {
      const url = images[j]; // Keep relative paths like /wp-uploads/... or full URLs
      await supabase.from('arabian_estate_listing_images').insert({
        listing_id: listingId,
        url,
        sort_order: j,
      });
    }
    console.log(`Inserted listing ${listingId}: ${listing.title?.slice(0, 40)}...`);
  }
  console.log('Done. Seeded', newCapitalListings.length, 'listings.');
}

main();
