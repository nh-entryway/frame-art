/**
 * Delete all archive items except the N newest
 * Usage: node scripts/cleanup-archive.js [keepCount]
 */
import { list, del } from '@vercel/blob';

const KEEP = parseInt(process.argv[2]) || 3;

async function cleanup() {
  // List all archive blobs
  const allBlobs = [];
  let cursor;
  do {
    const result = await list({ prefix: 'art/archive/', cursor, limit: 100 });
    allBlobs.push(...result.blobs);
    cursor = result.cursor;
  } while (cursor);

  console.log(`Found ${allBlobs.length} total archive blobs`);

  // Separate JSON metadata files
  const jsonBlobs = allBlobs
    .filter(b => b.pathname.endsWith('.json'))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  console.log(`Found ${jsonBlobs.length} JSON metadata files`);
  console.log(`Keeping newest ${KEEP}, deleting ${jsonBlobs.length - KEEP}`);

  // The newest N to keep
  const keepSet = new Set(jsonBlobs.slice(0, KEEP).map(b => b.url));

  // Show what we're keeping
  console.log('\nKeeping:');
  jsonBlobs.slice(0, KEEP).forEach(b => console.log(`  ✓ ${b.pathname}`));

  // Delete everything else
  const toDelete = allBlobs.filter(b => {
    // Keep the newest N JSON files
    if (keepSet.has(b.url)) return false;
    // Keep PNG files that match a kept JSON's timestamp
    const keepPaths = jsonBlobs.slice(0, KEEP).map(j => 
      j.pathname.replace('.json', '.png')
    );
    if (keepPaths.includes(b.pathname)) return false;
    return true;
  });

  console.log(`\nDeleting ${toDelete.length} blobs:`);
  for (const blob of toDelete) {
    console.log(`  ✗ ${blob.pathname}`);
    await del(blob.url);
  }

  console.log('\nDone!');
}

cleanup().catch(console.error);
