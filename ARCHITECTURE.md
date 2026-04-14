# Architecture

## System Overview

Frame Art is a serverless Next.js 16 application deployed on Vercel. It drives a 10.3" ePaper display (1404×1872 pixels, 16-level grayscale) that shows AI-generated woodcut art paired with Jenny Holzer-inspired truisms, driven by world news headlines.

The system has two content sources:

1. **Zeitgeist Pipeline** (automated): Hourly cron scrapes headlines → Claude generates truism + image prompt → Flux renders woodcut → ePaper displays the art
2. **SMS Pipeline** (manual): Family members text `prompt | CAPTION` → woodcut art appears on the frame

---

## AI Services — How They Connect

Everything runs through **one API key** (`AI_GATEWAY_API_KEY`) via the **Vercel AI Gateway**.

```
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL AI GATEWAY                          │
│              ai-gateway.vercel.sh/v1                        │
│                                                             │
│  One endpoint. One API key. Routes to multiple providers.   │
│                                                             │
│  ┌───────────────────┐    ┌──────────────────────────────┐  │
│  │  /v1/messages      │    │  /v1/images/generations      │  │
│  │  Claude Sonnet 4   │    │  bfl/flux-2-pro              │  │
│  │  (Anthropic)       │    │  (Black Forest Labs)         │  │
│  │                    │    │                              │  │
│  │  Used for:         │    │  Used for:                   │  │
│  │  • Scene rewrites  │    │  • Woodcut generation        │  │
│  │  • Zeitgeist       │    │  • Style reference via       │  │
│  │    truism gen      │    │    imagePrompt               │  │
│  └───────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Available Models via Gateway

The Gateway supports many image generation models. These are all used with the same `AI_GATEWAY_API_KEY`:

| Model ID | Provider | Capability |
|---|---|---|
| `bfl/flux-2-pro` | Black Forest Labs | Text-to-image, **imagePrompt** style reference ✅ |
| `bfl/flux-kontext-pro` | Black Forest Labs | Full image editing (transform existing images) |
| `bfl/flux-kontext-max` | Black Forest Labs | Higher quality image editing |
| `bfl/flux-2-flex` | Black Forest Labs | Multi-reference image generation |
| `bfl/flux-pro-1.0-fill` | Black Forest Labs | Inpainting |
| `google/imagen-4.0-generate-001` | Google Vertex | Text-to-image |
| `xai/grok-imagine-image-pro` | xAI | Text-to-image |

**We use `bfl/flux-2-pro` with `imagePrompt`** — the simplest option that doesn't require a new API key. See "Style Reference System" below.

### If We Wanted More Control: Direct BFL API

For **full image editing** (Flux Kontext — transform an existing image based on a text prompt), you'd install `@ai-sdk/black-forest-labs` and call BFL directly:

```js
// This would require a separate BFL_API_KEY from bfl.ai
import { blackForestLabs } from '@ai-sdk/black-forest-labs';
import { generateImage } from 'ai';

const { images } = await generateImage({
  model: blackForestLabs.image('flux-kontext-pro'),
  prompt: {
    text: 'Transform the owl into a warship in the same woodcut style',
    images: ['https://...blob.../art/owl-reference.png'],
  },
});
```

We don't use this today because `imagePrompt` through the Gateway achieves similar results with zero additional infrastructure.

---

## Style Reference System ("The Owl")

The frame uses a **master reference image** — a curated woodcut owl — as a style anchor for every generation. This ensures visual consistency across hourly updates.

```
┌────────────────────────────────────────────────────────────┐
│  HOW IT WORKS                                              │
│                                                            │
│  1. Owl lives in Blob: art/owl-reference.png               │
│  2. Before each generation, art.js fetches the owl         │
│  3. Owl is base64-encoded and sent as providerOptions:     │
│                                                            │
│     providerOptions: {                                     │
│       blackForestLabs: {                                   │
│         imagePrompt: "<base64-owl>",                       │
│         imagePromptStrength: 0.35   // 0=ignore, 1=copy    │
│       }                                                    │
│     }                                                      │
│                                                            │
│  4. Flux absorbs the owl's organic linework and graphic    │
│     contrast, then generates a NEW subject with that feel  │
│                                                            │
│  Result: Every woodcut has the same hand-carved quality,   │
│  regardless of whether the subject is a warship, a fist,   │
│  or a flight of birds.                                     │
└────────────────────────────────────────────────────────────┘
```

### Tuning imagePromptStrength

| Value | Effect |
|---|---|
| 0.0–0.2 | Owl barely influences — generates freely |
| 0.3–0.4 | **Sweet spot**: organic texture and contrast carry over, subject is new |
| 0.5–0.6 | Strong influence — output starts to resemble the owl |
| 0.7–1.0 | Owl dominates — output becomes a variation of the owl |

Current value: **0.35** (set in `lib/art.js` as `IMAGE_PROMPT_STRENGTH`)

### Uploading/Changing the Reference Image

```bash
# Upload a new reference image (requires BLOB_READ_WRITE_TOKEN)
BLOB_READ_WRITE_TOKEN=your_token node scripts/upload-owl.js path/to/image.png
```

The system degrades gracefully — if no owl is found in Blob, it generates without a style reference (same as before).

---

## File Structure

```
frame-art/
├── app/
│   ├── api/
│   │   ├── sms/
│   │   │   └── route.js          # Twilio SMS webhook (POST)
│   │   ├── generate/
│   │   │   └── route.js          # Cron: zeitgeist art generation (GET)
│   │   └── test-gateway/
│   │       └── route.js          # Debug endpoint for AI Gateway
│   ├── poem/
│   │   └── page.js               # ePaper display page (SSR)
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Home page
│   └── globals.css               # Global styles
├── lib/
│   ├── art.js                    # AI art pipeline (Claude + Flux + owl reference)
│   ├── storage.js                # Vercel Blob read/write
│   ├── scrape.js                 # Headline scraping
│   └── transform.js              # Headlines → truism + image prompt (Claude)
├── scripts/
│   └── upload-owl.js             # Upload owl reference image to Blob
├── vercel.json                   # Cron schedule config
├── next.config.mjs               # Next.js config
└── package.json                  # Dependencies
```

---

## Data Flow

### Zeitgeist Pipeline (Automated)

```
Vercel Cron (hourly)
    │
    ▼
GET /api/generate
    │
    ├── 1. Scrape headlines (BBC, NPR, AP via RSS)
    │
    ├── 2. Claude: headlines → truism + image prompt
    │      "ABUSE OF POWER COMES AS NO SURPRISE"
    │      Image: "A massive padlocked iron gate"
    │
    ├── 3. Flux 2 Pro: image prompt → woodcut
    │      + STYLE_PREFIX (locked woodcut description)
    │      + imagePrompt (owl reference from Blob)
    │      + imagePromptStrength: 0.35
    │
    ├── 4. Save to Blob
    │      ├── art/latest.png
    │      ├── art/latest.json (truism, headline, time)
    │      └── art/archive/{timestamp}.png
    │
    └── 5. /poem (SSR) renders:
           ┌──────────────────────┐
           │ ABUSE OF POWER       │ ← Truism (56px, bold)
           │ COMES AS NO SURPRISE │
           │ Iran nuclear · 14:30 │ ← Headline + time (28px)
           │ ┌──────────────────┐ │
           │ │                  │ │
           │ │   ▓▓  WOODCUT   │ │ ← Flux-generated art
           │ │   ▓▓  IMAGE     │ │    (with owl style reference)
           │ │                  │ │
           │ └──────────────────┘ │
           └──────────────────────┘
```

### SMS Pipeline (Manual)

```
User sends SMS: "burning city | THE END IS NEAR"
    │
    ▼
Twilio → POST /api/sms
    │
    ├── Parse: prompt="burning city", caption="THE END IS NEAR"
    ├── Claude: refine prompt → scene description
    ├── Flux: scene → woodcut (with owl reference)
    ├── Save to Blob (overwrites latest)
    └── /poem renders SMS view with caption
```

---

## Key Design Decisions

### Why Vercel AI Gateway?
Single API key (`AI_GATEWAY_API_KEY`) accesses both Claude (Anthropic) and Flux (Black Forest Labs) through `https://ai-gateway.vercel.sh`. No separate API keys needed. Vercel handles billing, routing, and retries. Supports `providerOptions` passthrough for model-specific features like `imagePrompt`.

### Why `imagePrompt` over Flux Kontext?
Flux Kontext (`bfl/flux-kontext-pro`) offers full image editing via the AI SDK, but requires a **separate BFL API key** (`BFL_API_KEY`) since the Gateway's OpenAI-compatible `/v1/images/generations` endpoint doesn't support `prompt.images`. The `imagePrompt` provider option on `bfl/flux-2-pro` achieves style transfer through the existing Gateway with zero new dependencies.

### Why the owl as a reference image?
Pure text-to-image generation produces inconsistent aesthetic quality across subjects. By anchoring every generation to a curated reference, we get:
- Consistent organic linework (not mechanical/AI-looking)
- Stable contrast ratios (critical for 16-level grayscale ePaper)
- Gallery-quality coherence across hourly updates

### Why Flux 2 Pro over DALL-E 3?
The AI Gateway model `bfl/flux-2-pro` supports `providerOptions.blackForestLabs.imagePrompt` for style reference — DALL-E 3 does not. Flux also produces superior line quality for monochrome woodcut rendering.

### Why base64 (`b64_json`) over URL?
The AI Gateway image endpoint returns base64-encoded images. This avoids a second fetch to download from a temporary URL and allows direct upload to Vercel Blob.

### Why `force-dynamic` on `/poem`?
The ePaper refreshes by hitting this URL. It must always return the latest content, never a cached build.

### Why cache-busting `?t=Date.now()` on the image?
The Blob URL for `art/latest.png` never changes (same path, overwritten content). Without cache-busting, Vercel's CDN and the browser serve stale images.

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.3 | App framework, SSR, API routes |
| `react` | 19.2.4 | UI rendering |
| `react-dom` | 19.2.4 | DOM rendering |
| `@vercel/blob` | ^2.3.3 | Blob storage for images and JSON |

No other dependencies. AI calls are raw `fetch()` to the AI Gateway REST API. The `@ai-sdk/black-forest-labs` package is **not required** for the current approach.

---

## External Services

| Service | How Used | Auth |
|---|---|---|
| **Vercel AI Gateway** | Claude text + Flux image generation + imagePrompt | `AI_GATEWAY_API_KEY` |
| **Vercel Blob** | Image storage, JSON metadata, owl reference | `BLOB_READ_WRITE_TOKEN` |
| **Twilio** | SMS webhook ingestion | Webhook URL config |
| **Vercel Cron** | Hourly zeitgeist generation | `CRON_SECRET` (optional) |

---

## Future Options

These are available but **not currently needed**:

| Feature | Model | Requires | Notes |
|---|---|---|---|
| Full image editing | `bfl/flux-kontext-pro` | `BFL_API_KEY` + `@ai-sdk/black-forest-labs` | Transform owl into new subjects |
| Multi-reference gen | `bfl/flux-2-flex` | `BFL_API_KEY` + `@ai-sdk/black-forest-labs` | Combine multiple style refs |
| Inpainting | `bfl/flux-pro-1.0-fill` | `BFL_API_KEY` + `@ai-sdk/black-forest-labs` | Fill masked regions |
| Google Imagen | `google/imagen-4.0-*` | Gateway (same key) | Alternative gen model |
