/**
 * Gallery settings stored in Vercel Blob
 * Controls: pinned image, generation on/off
 */
import { put, list } from '@vercel/blob';

const SETTINGS_PATH = 'art/settings.json';

const DEFAULT_SETTINGS = {
  pinnedTimestamp: null,   // ISO string of pinned archive entry, or null
  generateEnabled: true,   // whether cron generates new art
};

export async function getSettings() {
  try {
    const { blobs } = await list({ prefix: SETTINGS_PATH });
    if (blobs.length === 0) return { ...DEFAULT_SETTINGS };

    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return { ...DEFAULT_SETTINGS };
    const data = await res.json();
    return { ...DEFAULT_SETTINGS, ...data };
  } catch (e) {
    console.error('Failed to fetch settings:', e.message);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  await put(SETTINGS_PATH, JSON.stringify(merged, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
  return merged;
}
