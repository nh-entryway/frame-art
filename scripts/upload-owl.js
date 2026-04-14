/**
 * Upload the owl reference image to Vercel Blob
 * 
 * Usage: node scripts/upload-owl.js <path-to-owl-image>
 * 
 * This stores the owl at art/owl-reference.png in Blob,
 * which is used as the style reference for all generated art.
 */
import { put } from '@vercel/blob';
import { readFileSync } from 'fs';

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node scripts/upload-owl.js <path-to-owl-image>');
  process.exit(1);
}

const imageBuffer = readFileSync(imagePath);
console.log(`Read ${imageBuffer.length} bytes from ${imagePath}`);

const blob = await put('art/owl-reference.png', imageBuffer, {
  access: 'public',
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'image/png',
});

console.log(`Owl uploaded to: ${blob.url}`);
console.log('This URL is used as the style reference in lib/art.js');
