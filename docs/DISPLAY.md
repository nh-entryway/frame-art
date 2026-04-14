# Display Page

## Overview

The display page (`/poem`) is what the ePaper frame renders. It's a server-side rendered Next.js page that outputs a fixed 1404×1872px layout designed for a 10.3" ePaper display with 16-level grayscale.

**File:** `app/poem/page.js`
**URL:** `/poem`
**Rendering:** SSR with `force-dynamic` (never cached)

---

## Display Modes

The page uses a priority-based rendering system:

```
┌─────────────────────────────┐
│ 1. Art Mode (primary)       │ ← If art/latest.json exists with mode: "art"
│    Full-bleed charcoal +    │
│    black text bar            │
├─────────────────────────────┤
│ 2. News Mode (fallback)     │ ← If no art, show poems/latest.json
│    H/L/B generated poetry   │
├─────────────────────────────┤
│ 3. Hardcoded Fallback       │ ← If Blob is completely empty
│    Static placeholder poems │
└─────────────────────────────┘
```

---

## Art Mode Layout

When art exists, the display shows:

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│         FULL-BLEED IMAGE             │
│         (object-fit: cover)          │
│         Charcoal art fills           │
│         entire area above bar        │
│                                      │
│         CSS: grayscale(1)            │
│              contrast(1.15)          │
│                                      │
│                                      │
├──────────────────────────────────────┤ ← 3px white border-top
│ BLACK BAR                            │
│                                      │
│  H   playing tennis                  │
│  L   sad people                      │
│  B   making art                      │ ← italic
│                                      │
│                    — Noah · 9:34 PM  │
└──────────────────────────────────────┘
```

### Layout Structure

| Element | CSS | Notes |
|---|---|---|
| Container | `1404×1872px`, flex column | Fixed size for ePaper |
| Image area | `flex: 1`, position relative | Takes all space above bar |
| Image | `object-fit: cover`, absolute fill | Edge-to-edge, no gaps |
| Image filter | `grayscale(1) contrast(1.15)` | Optimized for ePaper |
| Image URL | `{url}?t={Date.now()}` | Cache-busting |
| Black bar | `flex-shrink: 0`, padding 36/60/44/60px | Fixed height at bottom |
| H/L/B labels | Helvetica 30px, bold, `letter-spacing: 0.3em` | Left column |
| H/L/B text | Georgia 38px, bold | Right column |
| Buffalo text | Georgia 38px, bold, *italic* | Distinguished from H/L |
| Attribution | Helvetica 26px, bold, right-aligned | `— Name · Time` |

### Time Formatting

Timestamps are converted to Eastern time (America/New_York) and displayed as `H:MM AM/PM`.

---

## News Mode Layout (Fallback)

When no art exists, the page shows AI-generated poetry:

```
┌──────────────────────────────────────┐
│                                      │
│  HIGH                                │
│  Solar farms now outpace coal        │
│  in twelve new provinces — the grid  │
│  learning to breathe without burning.│
│                                      │
├──────────────────────────────────────┤ ← 2px white line
│                                      │
│  LOW                                 │
│  Another hospital closes its doors   │
│  in the delta, where the river       │
│  carries more medicine than roads.   │
│                                      │
├──────────────────────────────────────┤ ← 2px white line
│                                      │
│  BUFFALO                             │
│  A man in Oslo trained his parrot    │
│  to order groceries online — the bird│
│  now prefers organic seed.           │
│                                      │
└──────────────────────────────────────┘
```

### News Layout Details

| Element | CSS |
|---|---|
| Background | `#000000` |
| Text | `#ffffff` |
| Labels (HIGH/LOW/BUFFALO) | Helvetica 32px, bold, `letter-spacing: 0.5em` |
| Poetry lines | Georgia 62px, bold, `line-height: 1.5` |
| Buffalo poetry | Georgia 62px, bold, *italic* |
| Dividers | 2px white lines |
| Padding | 80px top/bottom, 90px left/right |

---

## Data Loading

```javascript
export default async function PoemPage() {
  const art = await getLatestArt();         // Blob: art/latest.json
  if (art?.mode === 'art' && art.imageUrl) {
    return <ArtView art={art} />;
  }

  const news = await getLatestPoem();        // Blob: poems/latest.json
  return <NewsView data={news || FALLBACK} />;
}
```

Both `getLatestArt()` and `getLatestPoem()` fetch from Vercel Blob with `cache: 'no-store'`.

---

## ePaper Rendering Notes

- The ePaper display renders the page via a headless browser at `1404×1872px`
- Only 16 levels of gray are available — high contrast is essential
- The `grayscale(1) contrast(1.15)` filter on the image optimizes for this
- All backgrounds are pure `#000000` and text is pure `#ffffff` to maximize contrast
- No animations, hover states, or interactive elements (ePaper is static)
- The page is requested on a refresh interval by the ePaper controller
