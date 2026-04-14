# Deployment

## Overview

Frame Art deploys to Vercel via GitHub push. The `main` branch auto-deploys.

**Repository:** `nh-entryway/frame-art`
**Production URL:** `https://frame-art-gold.vercel.app`
**Display URL:** `https://frame-art-gold.vercel.app/poem`

---

## Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Required | Where Used | Example |
|---|---|---|---|
| `AI_GATEWAY_API_KEY` | **Yes** | `lib/art.js` (Claude + Flux) | `agw_...` |
| `BLOB_READ_WRITE_TOKEN` | **Yes** | `lib/storage.js` (auto-injected on Vercel if Blob is linked) | `vercel_blob_rw_...` |
| `FAMILY_CONTACTS` | **Yes** | `lib/storage.js` (phone→name map) | `+19175192944:Noah,+15551234567:Dad` |
| `CRON_SECRET` | No | `app/api/generate/route.js` (protect cron) | `my-secret-123` |

### AI Gateway Setup

The AI Gateway key is configured in **Vercel Dashboard → AI Gateway**:
1. Go to your Vercel team dashboard
2. Navigate to **AI** → **Gateway**
3. Create or copy your API key
4. OpenAI is added as "Bring Your Own Key" (BYOK) — this enables Flux and other models

### Vercel Blob Setup

1. Go to **Vercel Dashboard → Storage**
2. Create a Blob store (or link existing)
3. The `BLOB_READ_WRITE_TOKEN` is auto-injected when the store is linked to the project

---

## Vercel Configuration

### `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/generate",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs the news poem generation pipeline every hour.

### `next.config.mjs`

Default config, no customizations needed:

```javascript
const nextConfig = {};
export default nextConfig;
```

---

## Twilio Setup

### Configure Webhook

1. Log in to [Twilio Console](https://console.twilio.com)
2. Go to **Phone Numbers** → **Manage** → **Active Numbers**
3. Select your phone number
4. Under **Messaging** → **A Message Comes In**:
   - **Webhook:** `https://frame-art-gold.vercel.app/api/sms`
   - **Method:** `POST`
5. Save

### FAMILY_CONTACTS Format

Map each Twilio-format phone number to a display name:

```
+19175192944:Noah,+15551234567:Dad,+15559876543:Mom
```

- Phone numbers must include country code with `+`
- Names are used in the display attribution (`— Noah · 9:34 PM`)
- Unknown numbers fall back to last 4 digits

---

## Deploy Process

```bash
# Make changes
git add -A
git commit -m "description of changes"
git push origin main

# Vercel auto-deploys from main (~60-90 seconds)
```

### Verify Deployment

```bash
# Test SMS webhook
curl -s -X POST "https://frame-art-gold.vercel.app/api/sms" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "Body=H testing deploy L nothing B everything" \
  -d "From=%2B19175192944&To=%2B14754710181"

# Check display page
curl -s "https://frame-art-gold.vercel.app/poem" | head -20

# Check runtime logs
# Vercel Dashboard → Deployments → Logs
```

---

## ePaper Frame Configuration

The ePaper controller hits `/poem` on a refresh interval. Configure:

- **URL:** `https://frame-art-gold.vercel.app/poem`
- **Viewport:** `1404 × 1872` pixels
- **Refresh:** Every 5–15 minutes (configurable on the frame)
- **Render:** Full-page screenshot → display on ePaper

---

## Troubleshooting

### Art not updating on frame
- Check Vercel runtime logs for errors
- Verify `AI_GATEWAY_API_KEY` is set and valid
- The image uses cache-busting (`?t=timestamp`) — hard refresh should work
- Check `art/latest.json` in Vercel Blob to confirm new data was saved

### "Model not found" error
- The gateway model ID may have changed
- Try `curl -H "Authorization: Bearer $AI_GATEWAY_API_KEY" https://ai-gateway.vercel.sh/v1/models` to list available models
- Currently using `bfl/flux-2-pro` for images, `claude-sonnet-4-20250514` for text

### SMS not reaching webhook
- Verify Twilio webhook URL is exactly `https://frame-art-gold.vercel.app/api/sms` (no trailing slash)
- Check Twilio Console → **Monitor** → **Messaging** for delivery status
- Ensure the phone number's messaging configuration is set to POST

### Blob permission errors
- Ensure `BLOB_READ_WRITE_TOKEN` is set in Vercel env vars
- If using a linked Blob store, it should be auto-injected
- Check Vercel Dashboard → Storage for store status

---

## Cost Summary

| Service | Cost | Frequency |
|---|---|---|
| Vercel (Hobby) | Free | Always |
| AI Gateway (Claude) | ~$0.003/call | Per SMS |
| AI Gateway (Flux) | ~$0.05/image | Per SMS |
| Vercel Blob | Free tier | Storage |
| Twilio SMS | ~$0.01/message | Per SMS |
| **Total per submission** | **~$0.06** | |

At 5 submissions/day: ~$9/month.
