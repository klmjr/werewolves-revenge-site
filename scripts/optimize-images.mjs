// scripts/optimize-images.mjs
//
// Repeatable batch optimizer for role artwork in public/images/roles.
// Converts every PNG to WebP, downscaling anything larger than MAX_DIMENSION
// (these only ever render as small grid thumbnails or a single detail-page
// portrait, so the original full-resolution exports are massive overkill),
// then deletes the source PNG once its .webp replacement is written.
//
// Usage: npm run optimize-images

import { readdir, stat, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROLES_DIR = path.resolve('public/images/roles');
const MAX_DIMENSION = 1000; // px, longest edge
const WEBP_QUALITY = 82;

async function main() {
  const entries = await readdir(ROLES_DIR);
  const pngFiles = entries.filter((f) => f.toLowerCase().endsWith('.png'));

  console.log(`Found ${pngFiles.length} PNGs in ${ROLES_DIR}`);

  let totalBefore = 0;
  let totalAfter = 0;
  let converted = 0;

  for (const file of pngFiles) {
    const inputPath = path.join(ROLES_DIR, file);
    const outputPath = path.join(ROLES_DIR, file.replace(/\.png$/i, '.webp'));

    const { size: beforeSize } = await stat(inputPath);

    await sharp(inputPath)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);

    const { size: afterSize } = await stat(outputPath);
    await unlink(inputPath);

    totalBefore += beforeSize;
    totalAfter += afterSize;
    converted++;

    if (converted % 100 === 0) {
      console.log(`...${converted}/${pngFiles.length}`);
    }
  }

  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  console.log(`\nConverted ${converted} images.`);
  console.log(`Before: ${mb(totalBefore)} MB`);
  console.log(`After:  ${mb(totalAfter)} MB`);
  console.log(`Saved:  ${mb(totalBefore - totalAfter)} MB (${(100 - (totalAfter / totalBefore) * 100).toFixed(0)}%)`);
  console.log(`\nOriginal PNGs have been deleted now that their .webp replacements exist.`);
}

await mkdir(ROLES_DIR, { recursive: true });
await main();
