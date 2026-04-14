<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frame Art — Agent Context

## What This Is
A family ePaper frame that receives SMS text messages, generates Robert Longo-style charcoal art, and displays it. Read ARCHITECTURE.md and the docs/ folder before making changes.

## Critical Rules
1. **Never change the STYLE_PREFIX in `lib/art.js`** without explicit approval — it's the locked art style
2. **Always use `force-dynamic`** on `/poem` — the ePaper must always get fresh content
3. **Blob paths are deterministic** — `art/latest.png` and `art/latest.json` are overwritten each submission
4. **Cache-bust image URLs** — always append `?t=Date.now()` when rendering Blob images
5. **All text/background must be pure black/white** — the ePaper only has 16 gray levels
6. **The display is exactly 1404×1872px** — don't change these dimensions

## Key Files
- `lib/art.js` — AI art pipeline (Claude + Flux)
- `lib/storage.js` — Vercel Blob storage
- `app/api/sms/route.js` — Twilio webhook
- `app/poem/page.js` — ePaper display page
- `app/api/generate/route.js` — Cron: news poems

## Environment
- AI via Vercel AI Gateway (single key: `AI_GATEWAY_API_KEY`)
- Storage via Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
- Deployed to Vercel, auto-deploys from `main`
