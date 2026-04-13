/**
 * Vercel Blob storage for poem data
 */
import { put, list } from '@vercel/blob';

const BLOB_PREFIX = 'poems/';

export async function savePoemData(poemData) {
  const timestamp = new Date().toISOString();
  const filename = `${BLOB_PREFIX}latest.json`;

  const payload = {
    ...poemData,
    generatedAt: timestamp,
  };

  await put(filename, JSON.stringify(payload, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });

  // Also save an archive copy
  const archiveFilename = `${BLOB_PREFIX}archive/${timestamp.replace(/[:.]/g, '-')}.json`;
  await put(archiveFilename, JSON.stringify(payload, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });

  return payload;
}

export async function getLatestPoem() {
  try {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}latest.json` });
    if (blobs.length === 0) return null;

    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch latest poem:', e.message);
    return null;
  }
}
