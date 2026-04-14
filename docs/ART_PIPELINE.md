# Art Generation Pipeline

## Overview

The art pipeline transforms casual family H/L/B text into museum-quality charcoal art. It uses a two-step AI process: Claude writes the scene, Flux renders the image.

**File:** `lib/art.js`
**Exports:** `rewriteAsScene()`, `generateArt()`, `hlbToArt()`

---

## Pipeline Steps

```
Input: { high: "playing tennis", low: "sad people", buffalo: "making art" }
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 1: Claude       │
        │  Scene Rewriting      │
        │                       │
        │  Combines H/L/B into  │
        │  a vivid, cinematic   │
        │  scene description    │
        └───────────┬───────────┘
                    │
          "A lone figure serves a ball into
           blinding overhead light while behind
           them a crowd of slumped figures..."
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 2: Flux 2 Pro   │
        │  Image Generation     │
        │                       │
        │  Locked Longo-style   │
        │  prefix + scene desc  │
        │  → charcoal drawing   │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Step 3: Save         │
        │                       │
        │  art/latest.png       │
        │  art/archive/TS.png   │
        └───────────────────────┘
```

---

## Step 1: Scene Rewriting (`rewriteAsScene`)

**API:** Vercel AI Gateway (Anthropic)
**Endpoint:** `https://ai-gateway.vercel.sh/v1/messages`
**Model:** `claude-sonnet-4-20250514`
**Auth:** `x-api-key` header + `anthropic-version: 2023-06-01`

### Prompt Design

Claude receives each H/L/B entry with emotional context:

```
HIGH (a joy/positive): "playing tennis"
LOW (a sadness/struggle): "sad people"
BUFFALO (something wild/absurd): "making art"
```

It's instructed to:
- Write ONE unified scene (2-3 sentences)
- Think cinematically: lighting, composition, perspective
- NOT include style instructions (no "charcoal", "black and white")
- NOT use quotation marks or meta-commentary

This separation is critical: Claude describes *what* to draw, while the style prefix (Step 2) controls *how* to draw it.

### Response Handling

```javascript
const data = await res.json();
return data.content[0].text.trim();
```

---

## Step 2: Image Generation (`generateArt`)

**API:** Vercel AI Gateway (Image)
**Endpoint:** `https://ai-gateway.vercel.sh/v1/images/generations`
**Model:** `bfl/flux-2-pro`
**Auth:** `Authorization: Bearer <AI_GATEWAY_API_KEY>`

### Locked Style Prefix

Every image prompt begins with this non-negotiable prefix:

```
Hyper-realistic large-scale charcoal and graphite drawing on white paper.
Photorealistic with extreme meticulous detail. Deep velvety blacks in the
shadows, luminous bright whites where light hits. Dramatic, monumental,
cinematic composition. The charcoal medium is visible — smudged darks,
crisp graphite highlights, the grain of heavy paper showing through.
Museum quality fine art drawing, not illustration. No color whatsoever,
pure black and white charcoal.
```

The full prompt is: `{STYLE_PREFIX} Subject: {scene_description}`

### Request Format

```json
{
  "model": "bfl/flux-2-pro",
  "prompt": "<STYLE_PREFIX> Subject: <scene>",
  "n": 1,
  "response_format": "b64_json"
}
```

### Response Handling

The image comes back as base64-encoded PNG:

```javascript
const b64 = data.data[0].b64_json;
const imageBuffer = Buffer.from(b64, 'base64');
```

---

## Step 3: Blob Storage

Two copies are saved:

| Blob Path | Purpose | Overwrite? |
|---|---|---|
| `art/latest.png` | Current frame image | Yes (always) |
| `art/archive/{timestamp}.png` | Permanent archive | No (unique) |

Both are saved as public blobs with `image/png` content type.

---

## Cost Estimates

| Service | Per Request | Notes |
|---|---|---|
| Claude Sonnet 4 | ~$0.003 | ~150 input tokens, ~100 output tokens |
| Flux 2 Pro | ~$0.05 | Per image generation |
| **Total per SMS** | **~$0.05** | Dominated by image generation |

---

## Error Modes

| Error | Cause | Recovery |
|---|---|---|
| `AI_GATEWAY_API_KEY not set` | Missing env var | Add to Vercel project settings |
| `Claude scene rewrite failed` | API error, rate limit | Retry; check API key |
| `Image generation failed` | Model unavailable, bad prompt | Check gateway status; prompt may be too long |
| `put() fails` | Blob token issue | Check `BLOB_READ_WRITE_TOKEN` |

---

## Extending

### Changing the art style
Edit `STYLE_PREFIX` in `lib/art.js`. The current style is locked to Robert Longo-inspired charcoal. You can swap to woodcut, ink wash, etc.

### Switching image models
Change `model` in the `generateArt` function. The gateway supports:
- `bfl/flux-2-pro` (current, verified working)
- `openai/dall-e-3` (may require BYOK setup)
- Other models listed at `GET https://ai-gateway.vercel.sh/v1/models`

### Adjusting scene rewriting
Edit the Claude prompt in `rewriteAsScene()`. The current prompt emphasizes cinematic composition and emotional layering.
