<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frame Art — Agent Context

## What This Is
A family ePaper frame that displays bold woodcut art with Holzer-style text. Two content sources: world zeitgeist (headlines → editorial woodcut + truism) and user SMS (free-form prompt → woodcut + caption).

## Critical Rules
1. **Never change the STYLE_PREFIX in `lib/art.js`** without explicit approval — it's the locked relief print technique description (carved white lines on black field, parallel hatching, linocut masters)
2. **Always use `force-dynamic`** on `/poem` — the ePaper must always get fresh content
3. **Blob paths are deterministic** — `art/latest.png` and `art/latest.json` are overwritten each submission
4. **Cache-bust image URLs** — always append `?t=Date.now()` when rendering Blob images
5. **All text/background must be pure black/white** — the ePaper only has 16 gray levels
6. **The display is exactly 1404×1872px** — don't change these dimensions
7. **Text is ALL CAPS Helvetica** — Holzer-inspired, declarative, blunt
8. **SMS format is `prompt | CAPTION`** — pipe separates prompt from optional caption
9. **The owl reference image is the style anchor** — it lives at `art/owl-reference.png` in Blob. Don't delete it or change `IMAGE_PROMPT_STRENGTH` (currently 0.45) without approval.

## Style Reference System
- The owl image (`art/owl-reference.png` in Blob) is passed as `providerOptions.blackForestLabs.imagePrompt` to every Flux generation
- `IMAGE_PROMPT_STRENGTH` (0.35) controls style transfer intensity — tune carefully
- If the owl is missing, art.js falls back to generating without a style reference
- Upload a new reference: `node scripts/upload-owl.js <path>`

## Key Files
- `lib/art.js` — AI art pipeline (Claude scene + Flux woodcut + owl style reference)
- `lib/transform.js` — Zeitgeist generator (headlines → truism + image prompt)
- `lib/storage.js` — Vercel Blob storage
- `app/api/sms/route.js` — Twilio webhook (free-form prompt + caption)
- `app/poem/page.js` — ePaper display page (ZeitgeistView / SmsView)
- `app/api/generate/route.js` — Cron: zeitgeist art generation
- `scripts/upload-owl.js` — Upload style reference image to Blob

## Environment
- AI via Vercel AI Gateway (single key: `AI_GATEWAY_API_KEY`)
- Storage via Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
- Deployed to Vercel, auto-deploys from `main`

## AI Gateway Models Available
All through the same `AI_GATEWAY_API_KEY`:
- **`bfl/flux-2-pro`** — Current model. Supports `imagePrompt` for style reference.
- **`bfl/flux-kontext-pro/max`** — Full image editing (transform images). Requires separate `BFL_API_KEY` + `@ai-sdk/black-forest-labs` npm package.
- **`google/imagen-4.0-*`** — Google's image gen. Available but untested.
- **`xai/grok-imagine-image-pro`** — xAI's image gen. Available but untested.
