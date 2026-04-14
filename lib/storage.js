/**
 * Vercel Blob storage for art submissions
 */
import { put, list } from '@vercel/blob';

// ─── Family contacts ───

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

// ─── Art Submissions ───

/**
 * Save art submission metadata to Blob
 *
 * Schema:
 * {
 *   mode: "art",
 *   source: "zeitgeist" | "sms",
 *   prompt: "original prompt",
 *   scene: "Claude-refined scene description",
 *   headline: "FACTUAL HEADLINE" (zeitgeist only),
 *   truism: "HOLZER-STYLE TRUISM" (zeitgeist only),
 *   caption: "USER CAPTION" (sms only),
 *   imageUrl: "https://...blob.../art/latest.png",
 *   from: "Noah" (sms) | null (zeitgeist),
 *   phone: "+19175192944" (sms) | null (zeitgeist),
 *   newsSource: "BBC" (zeitgeist) | null (sms),
 *   timestamp: "2026-04-14T..."
 * }
 */
export async function saveArtSubmission(submission) {
  const payload = {
    mode: 'art',
    ...submission,
  };

  await put('art/latest.json', JSON.stringify(payload, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });

  // Also archive
  const archiveFilename = `art/archive/${submission.timestamp || new Date().toISOString()}.json`;
  await put(archiveFilename, JSON.stringify(payload, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });

  return payload;
}

export async function getLatestArt() {
  try {
    const { blobs } = await list({ prefix: 'art/latest.json' });
    if (blobs.length === 0) return null;

    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch latest art:', e.message);
    return null;
  }
}

/**
 * Get all archived art submissions, newest first
 */
export async function getArchivedArt() {
  try {
    const allBlobs = [];
    let cursor;

    // Paginate through all archive blobs
    do {
      const result = await list({ prefix: 'art/archive/', cursor, limit: 100 });
      allBlobs.push(...result.blobs);
      cursor = result.cursor;
    } while (cursor);

    // Filter to only JSON metadata files
    const jsonBlobs = allBlobs.filter(b => b.pathname.endsWith('.json'));

    // Fetch each metadata file
    const items = await Promise.all(
      jsonBlobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url, { cache: 'no-store' });
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      })
    );

    // Filter nulls and sort newest first
    return items
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (e) {
    console.error('Failed to fetch archived art:', e.message);
    return [];
  }
}
