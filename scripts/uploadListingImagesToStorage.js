/**
 * Upload listing images to Supabase Storage and update arabian_estate_listing_images.url.
 * Compresses images before upload to reduce storage size (max 1920px, ~800KB).
 *
 * Uses (in order): local public/wp-uploads/ files → IMAGES_BASE_URL → placeholder image.
 * So you can run npm run upload-images with no local files; placeholders are uploaded automatically.
 *
 * 1. Bucket "listing-images" must exist in Supabase (Storage → New bucket, Public).
 * 2. Run: npm run upload-images
 *
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (from .env)
 * Optional: LOCAL_IMAGES_PATH, IMAGES_BASE_URL (skip placeholders when set)
 */
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);
const BUCKET = 'listing-images';
const defaultLocalPath = resolve(__dirname, '../public/wp-uploads');
const localPath = process.env.LOCAL_IMAGES_PATH
  ? resolve(process.env.LOCAL_IMAGES_PATH)
  : defaultLocalPath;

function filenameFromUrl(imageUrl) {
  const pathPart = imageUrl.startsWith('http') ? new URL(imageUrl).pathname : imageUrl;
  return pathPart.replace(/^\/+/, '').split('/').pop() || 'image.jpg';
}

function isStorageUrl(u) {
  return typeof u === 'string' && (u.includes('supabase.co/storage') || u.includes('supabase') && u.includes('/object/'));
}

/** Fetch a placeholder image (used when no local file or IMAGES_BASE_URL) */
async function getPlaceholderBuffer(listingId, index) {
  const w = 600;
  const h = 400;
  const text = encodeURIComponent(`Listing ${listingId}`);
  const placeholderUrl = `https://placehold.co/${w}x${h}/e8e8e8/999?text=${text}`;
  const res = await fetch(placeholderUrl);
  if (res.ok) return Buffer.from(await res.arrayBuffer());
  return null;
}

async function getImageBuffer(imageUrl, filename, listingId, sortOrder) {
  const localFile = resolve(localPath, filename);
  if (existsSync(localFile)) {
    return readFileSync(localFile);
  }
  const base = process.env.IMAGES_BASE_URL || '';
  if (base) {
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : base.replace(/\/$/, '') + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
    const res = await fetch(fullUrl);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  return getPlaceholderBuffer(listingId, sortOrder);
}

/** Compress image buffer to reduce storage size. Returns { buffer, contentType }. */
async function compressImageBuffer(buffer, filename) {
  try {
    const isPng = /\.png$/i.test(filename);
    const outExt = isPng ? 'png' : 'jpg';
    let pipeline = sharp(buffer)
      .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true });
    if (isPng) {
      pipeline = pipeline.png({ compressionLevel: 9 });
    } else {
      pipeline = pipeline.jpeg({ quality: 80 });
    }
    const compressed = await pipeline.toBuffer();
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    return { buffer: compressed, contentType };
  } catch {
    const contentType = filename.match(/\.jpe?g$/i) ? 'image/jpeg' : filename.match(/\.png$/i) ? 'image/png' : 'image/jpeg';
    return { buffer, contentType };
  }
}

const IMAGES_TABLE = 'arabian_estate_listing_images';

async function main() {
  console.log('Uploading listing images to Supabase Storage (compressed) and updating', IMAGES_TABLE);
  console.log('Bucket name:', BUCKET);
  console.log('Local path:', localPath);
  if (process.env.IMAGES_BASE_URL) console.log('Fallback fetch base:', process.env.IMAGES_BASE_URL);
  console.log('(Missing files → placeholder images will be uploaded.)\n');

  const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (bucketErr) {
    if (bucketErr.message?.includes('already exists') || bucketErr.message?.includes('duplicate') || bucketErr.message?.includes('Conflict')) {
      console.log(`Bucket "${BUCKET}" already exists, continuing.\n`);
    } else {
      console.warn(`Could not create bucket (you may need to create it in Dashboard): ${bucketErr.message}`);
      console.warn('In Supabase: Storage → New bucket → Name: listing-images → Public: ON\n');
    }
  } else {
    console.log(`Bucket "${BUCKET}" created.\n`);
  }

  const { data: rows, error } = await supabase.from(IMAGES_TABLE).select('id, listing_id, url, sort_order');
  if (error) {
    console.error('Failed to load', IMAGES_TABLE + ':', error);
    process.exit(1);
  }
  if (!rows?.length) {
    console.log('No listing_images rows found.');
    return;
  }
  console.log(`Found ${rows.length} image rows to process.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const currentUrl = row.url;
    if (!currentUrl) continue;
    if (isStorageUrl(currentUrl)) {
      skipped++;
      continue;
    }

    const filename = filenameFromUrl(currentUrl);
    let buffer = await getImageBuffer(currentUrl, filename, row.listing_id, row.sort_order ?? 0);
    if (!buffer) {
      console.warn(`Skip (no source): ${filename} [listing_id=${row.listing_id}]`);
      failed++;
      continue;
    }

    const { buffer: compressedBuffer, contentType } = await compressImageBuffer(buffer, filename);
    const ext = (filename.split('.').pop() || 'jpg').toLowerCase().replace(/jpeg/, 'jpg');
    const storagePath = `${row.listing_id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, compressedBuffer, {
      contentType,
      upsert: true,
    });
    if (upErr) {
      console.warn(`Upload failed ${storagePath}:`, upErr.message);
      failed++;
      continue;
    }

    const publicUrl = `${url.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    const { error: updateErr } = await supabase.from(IMAGES_TABLE).update({ url: publicUrl }).eq('id', row.id);
    if (updateErr) {
      console.warn(`Update url failed for id=${row.id}:`, updateErr.message);
      failed++;
      continue;
    }
    updated++;
    console.log(`Uploaded & updated: ${storagePath}`);
  }

  console.log(`Done. Updated: ${updated}, skipped (already Storage): ${skipped}, failed: ${failed}`);
}

main();
