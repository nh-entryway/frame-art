# Frame Art

A family ePaper display that receives text messages, generates Robert Longo-inspired charcoal art, and shows it on a 10.3" ePaper frame.

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
```

**Frame display URL:** `/poem`
**SMS webhook:** `POST /api/sms`
**News cron job:** `GET /api/generate`

## How It Works

Text the frame your High, Low, and Buffalo:

```
H playing tennis L sad people B making art
```

The frame parses H/L/B → Claude writes a unified scene → Flux 2 Pro renders charcoal art → frame shows full-bleed art with your words.

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, file layout, data flow |
| [docs/SMS_PIPELINE.md](./docs/SMS_PIPELINE.md) | SMS webhook, H/L/B parsing, message format |
| [docs/ART_PIPELINE.md](./docs/ART_PIPELINE.md) | AI art generation: Claude scene + Flux image |
| [docs/DISPLAY.md](./docs/DISPLAY.md) | ePaper display page, rendering modes, layout |
| [docs/STORAGE.md](./docs/STORAGE.md) | Vercel Blob storage schema and data model |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Environment variables, Vercel config, Twilio setup |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AI_GATEWAY_API_KEY` | Yes | Vercel AI Gateway key (powers Claude + Flux) |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob storage token |
| `FAMILY_CONTACTS` | Yes | Phone-to-name map: `+15551234567:Dad,+15559876543:Mom` |
| `CRON_SECRET` | No | Protects `/api/generate` cron endpoint |

## Architecture

```
SMS (Twilio) → /api/sms → Parse H/L/B
                              ↓
                     Claude (scene rewrite)
                              ↓
                     Flux 2 Pro (charcoal art)
                              ↓
                     Vercel Blob (image + JSON)
                              ↓
                     /poem (full-bleed display)
                              ↓
                     ePaper frame (1404×1872px)
```

## Tech Stack

- **Runtime:** Next.js 16 on Vercel
- **AI:** Vercel AI Gateway → Claude Sonnet 4 + Flux 2 Pro
- **Storage:** Vercel Blob
- **SMS:** Twilio webhook
- **Display:** 10.3" ePaper (1404×1872, 16-level grayscale)
