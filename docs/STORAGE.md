# Storage

## Overview

All persistent data is stored in **Vercel Blob**. There is no database. The system uses a simple key-value pattern: JSON files for metadata and PNG files for images.

**File:** `lib/storage.js`
**Auth:** `BLOB_READ_WRITE_TOKEN` environment variable (auto-injected on Vercel)

---

## Blob Structure

```
vercel-blob/
├── art/
│   ├── latest.png              # Current frame image (overwritten each submission)
│   ├── latest.json             # Current art metadata (H/L/B, from, time, scene)
│   └── archive/
│       ├── 1713052200000.png   # Archived art images (never overwritten)
│       ├── 1713055800000.png
│       └── ...
├── poems/
│   ├── latest.json             # Current AI-generated poems
│   └── archive/
│       └── 2026-04-13T...json  # Archived poem generations
└── family/
    ├── latest.json             # Combined family submissions (legacy)
    ├── high.json               # Individual category (legacy)
    ├── low.json
    └── buffalo.json
```

---

## Data Schemas

### Art Submission (`art/latest.json`)

```json
{
  "mode": "art",
  "high": "playing tennis",
  "low": "sad people",
  "buffalo": "making art",
  "scene": "A lone figure mid-serve against blinding overhead light...",
  "imageUrl": "https://j8vcvntlgmurjxs8.public.blob.vercel-storage.com/art/latest.png",
  "from": "Noah",
  "phone": "+19175192944",
  "timestamp": "2026-04-13T21:34:00.000Z"
}
```

| Field | Type | Description |
|---|---|---|
| `mode` | string | Always `"art"` |
| `high` | string \| null | The HIGH entry from the text |
| `low` | string \| null | The LOW entry from the text |
| `buffalo` | string \| null | The BUFFALO entry from the text |
| `scene` | string | Claude's scene description (used as Flux prompt) |
| `imageUrl` | string | Public Blob URL of the generated image |
| `from` | string | Sender display name (from FAMILY_CONTACTS) |
| `phone` | string | Sender phone number (E.164 format) |
| `timestamp` | string | ISO 8601 timestamp of when SMS was received |

### News Poems (`poems/latest.json`)

```json
{
  "high": {
    "line1": "Solar farms now outpace coal",
    "line2": "in twelve new provinces — the grid",
    "line3": "learning to breathe without burning."
  },
  "low": {
    "line1": "Another hospital closes its doors",
    "line2": "in the delta, where the river carries",
    "line3": "more medicine than the roads."
  },
  "buffalo": {
    "line1": "A man in Oslo trained his parrot",
    "line2": "to order groceries online — the bird",
    "line3": "now prefers organic seed."
  },
  "generatedAt": "2026-04-13T20:00:00.000Z"
}
```

---

## Storage Functions

### `saveArtSubmission(data)`
Saves art metadata to `art/latest.json`. Called by the SMS webhook after art generation.

### `getLatestArt()`
Reads `art/latest.json` from Blob. Returns parsed JSON or `null`. Uses `cache: 'no-store'` to bypass CDN cache.

### `savePoemData(poemData)`
Saves news poems to `poems/latest.json` + archive copy. Called by the cron job.

### `getLatestPoem()`
Reads `poems/latest.json` from Blob. Returns parsed JSON or `null`.

### `getFamilyContacts()`
Parses `FAMILY_CONTACTS` env var into a phone-to-name mapping. Not Blob-based.

### `saveFamilySubmission(submission)` (legacy)
Saves individual H/L/B submissions under `family/`. Used by original per-category SMS flow. Retained for backward compatibility.

### `getLatestFamilySubmissions()` (legacy)
Reads combined family submissions from `family/latest.json`.

---

## Blob Access Patterns

All reads use `list()` + `fetch()`:

```javascript
const { blobs } = await list({ prefix: 'art/latest.json' });
if (blobs.length === 0) return null;
const res = await fetch(blobs[0].url, { cache: 'no-store' });
return await res.json();
```

All writes use `put()` with `allowOverwrite: true`:

```javascript
await put('art/latest.json', JSON.stringify(payload), {
  access: 'public',
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'application/json',
});
```

---

## Important Notes

- **All blobs are public.** The image URLs are directly accessible (required for the ePaper to load them).
- **`allowOverwrite: true`** is essential for `latest.*` files. Without it, `put()` fails on existing paths.
- **`addRandomSuffix: false`** ensures deterministic URLs. The blob URL for `art/latest.png` never changes.
- **Archive images** use timestamp-based filenames and are never overwritten.
- **Cache-busting** is handled at the display layer (`?t=Date.now()`), not in storage.
