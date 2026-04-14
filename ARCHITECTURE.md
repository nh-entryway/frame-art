# Architecture

## System Overview

Frame Art is a serverless Next.js 16 application deployed on Vercel. It drives a 10.3" ePaper display (1404×1872 pixels, 16-level grayscale) that shows AI-generated charcoal art based on family text messages.

The system has two independent pipelines:

1. **SMS → Art Pipeline** (primary): Family members text H/L/B submissions → charcoal art appears on the frame
2. **News → Poetry Pipeline** (fallback): Hourly cron scrapes headlines → AI generates poems → displayed when no art exists

---

## File Structure

```
frame-art/
├── app/
│   ├── api/
│   │   ├── sms/
│   │   │   └── route.js          # Twilio SMS webhook (POST)
│   │   ├── generate/
│   │   │   └── route.js          # Cron: headlines → poetry (GET)
│   │   └── test-gateway/
│   │       └── route.js          # Debug endpoint for AI Gateway
│   ├── poem/
│   │   └── page.js               # ePaper display page (SSR)
│   ├── mockup/
│   │   └── page.js               # Design mockup page
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Home page
│   └── globals.css               # Global styles
├── lib/
│   ├── art.js                    # AI art pipeline (Claude + Flux)
│   ├── storage.js                # Vercel Blob read/write
│   ├── scrape.js                 # Headline scraping
│   └── transform.js              # Headlines → poetry (Claude)
├── vercel.json                   # Cron schedule config
├── next.config.mjs               # Next.js config
└── package.json                  # Dependencies
```

---

## Data Flow

### Primary: SMS → Art → Display

```
┌──────────────────────────────────────────────────────────────┐
│                        INGESTION                             │
│                                                              │
│  User sends SMS ──→ Twilio ──→ POST /api/sms                │
│                                     │                        │
│                              Parse H/L/B text                │
│                                     │                        │
│                      ┌──────────────┼──────────────┐         │
│                      ▼              ▼              ▼         │
│                   high:          low:          buffalo:       │
│               "playing         "sad           "making        │
│                tennis"         people"         art"           │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    ART GENERATION                            │
│                                                              │
│  Step 1: Claude Sonnet 4 (via AI Gateway /v1/messages)       │
│          Combines H/L/B into a unified scene description     │
│                         │                                    │
│  Step 2: Flux 2 Pro (via AI Gateway /v1/images/generations)  │
│          Generates charcoal art with locked Longo-style      │
│          prefix. Returns base64 PNG.                         │
│                         │                                    │
│  Step 3: Save to Vercel Blob                                 │
│          ├── art/latest.png    (current frame image)         │
│          ├── art/latest.json   (metadata: H/L/B, from, time)│
│          └── art/archive/TS.png (permanent archive)          │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                      DISPLAY                                 │
│                                                              │
│  GET /poem (SSR, force-dynamic)                              │
│       │                                                      │
│       ├── Art mode? → Full-bleed charcoal image              │
│       │                + black bar: H/L/B text + name + time │
│       │                                                      │
│       └── Fallback  → News poetry (H/L/B generated poems)   │
│                                                              │
│  ePaper renders at 1404×1872px                               │
│  CSS filter: grayscale(1) contrast(1.15)                     │
└──────────────────────────────────────────────────────────────┘
```

### Secondary: News Cron (Fallback)

```
Vercel Cron (hourly) ──→ GET /api/generate
                              │
                        Scrape headlines
                              │
                        Claude: headlines → H/L/B poems
                              │
                        Save to Blob (poems/latest.json)
                              │
                        /poem renders poems if no art exists
```

---

## Key Design Decisions

### Why Vercel AI Gateway?
Single API key (`AI_GATEWAY_API_KEY`) accesses both Claude (Anthropic) and Flux (Black Forest Labs) through `https://ai-gateway.vercel.sh`. No separate API keys needed. Uses "Bring Your Own Key" for OpenAI.

### Why Flux 2 Pro over DALL-E 3?
The AI Gateway model `bfl/flux-2-pro` is verified working. DALL-E 3 via `openai/dall-e-3` returned "model not found" on this gateway configuration. Flux produces excellent charcoal-style renderings and handles the Longo-style prompt well.

### Why base64 (`b64_json`) over URL?
The AI Gateway image endpoint returns base64-encoded images. This avoids a second fetch to download from a temporary URL and allows direct upload to Vercel Blob.

### Why `force-dynamic` on `/poem`?
The ePaper refreshes by hitting this URL. It must always return the latest content, never a cached build.

### Why CSS `filter: grayscale(1) contrast(1.15)`?
The ePaper display is 16-level grayscale. Forcing grayscale and boosting contrast ensures the charcoal art renders with deep blacks and crisp whites on the physical display.

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

No other dependencies. AI calls are raw `fetch()` to the AI Gateway REST API.

---

## External Services

| Service | How Used | Auth |
|---|---|---|
| **Vercel AI Gateway** | Claude text + Flux image generation | `AI_GATEWAY_API_KEY` (header) |
| **Vercel Blob** | Image and JSON storage | `BLOB_READ_WRITE_TOKEN` (env) |
| **Twilio** | SMS webhook ingestion | Webhook URL config in Twilio console |
| **Vercel Cron** | Hourly news poem generation | `CRON_SECRET` (optional) |
