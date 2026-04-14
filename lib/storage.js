/**
 * Vercel Blob storage for poem data and family submissions
 */
import { put, list } from '@vercel/blob';

const BLOB_PREFIX = 'poems/';
const FAMILY_PREFIX = 'family/';

// ─── News Poems ───

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
    allowOverwrite: true,
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

// ─── Family Submissions ───

export function getFamilyContacts() {
  // Format: "+15551234567:Dad,+15559876543:Mom,+15551112222:Sarah"
  const raw = process.env.FAMILY_CONTACTS || '';
  const contacts = {};
  raw.split(',').forEach(entry => {
    const [phone, name] = entry.split(':');
    if (phone && name) {
      contacts[phone.trim()] = name.trim();
    }
  });
  return contacts;
}

export async function saveFamilySubmission(submission) {
  // Save individual submission to latest for that category
  const categoryFile = `${FAMILY_PREFIX}${submission.category.toLowerCase()}.json`;
  await put(categoryFile, JSON.stringify(submission, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });

  // Also update the combined family latest
  const existing = await getLatestFamilySubmissions();
  existing[submission.category.toLowerCase()] = submission;
  existing.lastUpdated = new Date().toISOString();
  existing.mode = 'family';

  await put(`${FAMILY_PREFIX}latest.json`, JSON.stringify(existing, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });

  return existing;
}

export async function getLatestFamilySubmissions() {
  try {
    const { blobs } = await list({ prefix: `${FAMILY_PREFIX}latest.json` });
    if (blobs.length === 0) return {};

    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch family submissions:', e.message);
    return {};
  }
}
