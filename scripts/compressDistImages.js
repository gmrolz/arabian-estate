/**
 * Compress images in dist/ folder for smaller upload size.
 * Resizes to max 800px, JPEG quality 60. Run after build.
 *
 * Run: node scripts/compressDistImages.js
 * Or: npm run compress-dist
 */
import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const MAX_SIZE = 480;       // Mobile-first (2x for retina = 960px display)
const JPEG_QUALITY = 48;   // Smaller for fast mobile loading
const PNG_COMPRESSION = 9;

async function getAllImagePaths(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await getAllImagePaths(full, acc);
    } else if (/\.(png|jpg|jpeg)$/i.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

async function compressFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  const isPng = ext === '.png';
  const buffer = await readFile(filePath);
  const originalSize = buffer.length;

  let pipeline = sharp(buffer).resize(MAX_SIZE, MAX_SIZE, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (isPng) {
    pipeline = pipeline.png({ compressionLevel: PNG_COMPRESSION });
  } else {
    pipeline = pipeline.jpeg({ quality: JPEG_QUALITY });
  }

  const compressed = await pipeline.toBuffer();
  if (compressed.length >= originalSize) return { saved: 0, original: originalSize, path: filePath };

  await writeFile(filePath, compressed);
  return {
    saved: originalSize - compressed.length,
    original: originalSize,
    final: compressed.length,
    path: filePath,
  };
}

async function main() {
  console.log('Compressing images in dist/...\n');
  const files = await getAllImagePaths(DIST);
  console.log(`Found ${files.length} images.\n`);

  let totalSaved = 0;
  let totalOriginal = 0;
  let processed = 0;

  for (const fp of files) {
    try {
      const rel = fp.replace(DIST, '').replace(/^[/\\]/, '');
      const result = await compressFile(fp);
      totalOriginal += result.original;
      if (result.saved > 0) {
        totalSaved += result.saved;
        processed++;
        const pct = ((result.saved / result.original) * 100).toFixed(0);
        console.log(`  ✓ ${rel}  ${(result.original / 1024).toFixed(0)}KB → ${(result.final / 1024).toFixed(0)}KB (-${pct}%)`);
      }
    } catch (err) {
      console.warn(`  ✗ ${fp}:`, err.message);
    }
  }

  const totalFinal = totalOriginal - totalSaved;
  console.log('\nDone.');
  console.log(`Compressed ${processed} images.`);
  console.log(`Total: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB → ${(totalFinal / 1024 / 1024).toFixed(1)}MB (saved ${(totalSaved / 1024 / 1024).toFixed(1)}MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
