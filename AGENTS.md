<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frame Art — Agent Context

## What This Is
A family ePaper frame that displays bold woodcut art with Holzer-style text. The **owl** is the recurring editorial character — a great horned owl woodcut that gets transformed each hour to reflect world news. Two content sources: world zeitgeist (headlines → owl transformation + truism) and user SMS (free-form prompt → owl transformation + caption).

## Critical Rules
1. **The owl is the character** — every image generation transforms the owl reference image. Do not generate images without the owl as input.
2. **Always use `force-dynamic`** on `/poem` — the ePaper must always get fresh content
3. **Blob paths are deterministic** — `art/latest.png` and `art/latest.json` are overwritten each submission
4. **Cache-bust image URLs** — always append `?t=Date.now()` when rendering Blob images
5. **All text/background must be pure black/white** — the ePaper only has 16 gray levels
6. **The display is exactly 1404×1872px** — don't change these dimensions
7. **Text is ALL CAPS Helvetica** — Holzer-inspired, declarative, blunt
8. **SMS format is `prompt | CAPTION`** — pipe separates prompt from optional caption
9. **The owl reference image** lives at `art/owl-reference.png` in Blob. Don't delete it.
10. **Two API keys** — `AI_GATEWAY_API_KEY` for Claude (text), `BFL_API_KEY` for FLUX.2 (image editing)

## Owl Editorial System
- The owl image (`art/owl-reference.png` in Blob) is sent as `input_image` to every FLUX.2 generation
- FLUX.2 transforms the owl to match the scene description (e.g., owl wrapped in chains, owl wearing a helmet)
- Claude writes transformation prompts ("how to modify the owl") not standalone subject descriptions
- The owl's identity (gaze, carved linework, portrait composition) persists across all generations
- Upload a new reference: `node scripts/upload-owl.js <path>`

## Key Files
- `lib/art.js` — AI art pipeline (Claude transformation prompt + FLUX.2 owl editing via BFL direct API)
- `lib/transform.js` — Zeitgeist generator (headlines → truism + owl transformation prompt)
- `lib/storage.js` — Vercel Blob storage
- `app/api/sms/route.js` — Twilio webhook (free-form prompt + caption)
- `app/poem/page.js` — ePaper display page (ZeitgeistView / SmsView)
- `app/api/generate/route.js` — Cron: zeitgeist art generation
- `scripts/upload-owl.js` — Upload owl reference image to Blob

## Environment
- Claude text via Vercel AI Gateway (`AI_GATEWAY_API_KEY`)
- Image generation via BFL direct API (`BFL_API_KEY`) — FLUX.2 [pro] image editing
- Storage via Vercel Blob (`BLOB_READ_WRITE_TOKEN`)
- Deployed to Vercel, auto-deploys from `main`

## API Architecture
- **Claude** (text): Vercel AI Gateway → `ai-gateway.vercel.sh/v1/messages` — scene rewrite, truism generation
- **FLUX.2** (image editing): BFL direct → `api.bfl.ai/v1/flux-2-pro-preview` — owl transformation
- BFL uses async polling: POST → get `polling_url` → poll until `status === "Ready"` → download `result.sample`
