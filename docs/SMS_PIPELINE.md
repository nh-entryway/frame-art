# SMS Pipeline

## Overview

The SMS pipeline receives text messages via Twilio, parses High/Low/Buffalo entries, generates a unified charcoal art piece, and saves it for display.

**Endpoint:** `POST /api/sms`
**File:** `app/api/sms/route.js`

---

## Message Format

Users text their H/L/B in a single message. Both short and long forms are supported:

### Short form (recommended)
```
H playing tennis L sad people B making art
```

### Long form
```
HIGH playing tennis LOW sad people BUFFALO making art
```

### With colons
```
H: playing tennis L: sad people B: making art
```

### Multiline
```
H playing tennis
L sad people
B making art
```

### Partial (any subset of H, L, B)
```
H got a promotion B a squirrel stole my lunch
```

> **Minimum requirement:** At least one of H, L, or B must be present. If none are detected, the webhook returns a help message.

---

## Parsing Logic

The parser uses three independent regex patterns:

```javascript
/\b(?:H|HIGH)[:\s]+(.+?)(?=\s+(?:L|LOW|B|BUFFALO)\b|$)/i    // HIGH
/\b(?:L|LOW)[:\s]+(.+?)(?=\s+(?:H|HIGH|B|BUFFALO)\b|$)/i     // LOW
/\b(?:B|BUFFALO)[:\s]+(.+?)(?=\s+(?:H|HIGH|L|LOW)\b|$)/i     // BUFFALO
```

Each regex:
1. Matches the label keyword (`H`, `HIGH`, `L`, `LOW`, `B`, `BUFFALO`)
2. Captures everything after (non-greedy) until the next label or end of string
3. Case-insensitive

**Edge cases:**
- H/L/B can appear in any order
- Newlines are normalized to spaces before parsing
- Leading/trailing whitespace is trimmed from each entry

---

## Request Flow

```
Twilio POST (application/x-www-form-urlencoded)
    │
    ├── Body: "H playing tennis L sad people B making art"
    ├── From: "+19175192944"
    └── To:   "+14754710181"
         │
         ▼
    Parse formData
         │
         ▼
    Look up sender name from FAMILY_CONTACTS env var
    ("+19175192944" → "Noah")
         │
         ▼
    parseHLB(body)
    → { high: "playing tennis", low: "sad people", buffalo: "making art" }
         │
         ▼
    hlbToArt({ high, low, buffalo })  ← see ART_PIPELINE.md
         │
         ▼
    saveArtSubmission({ high, low, buffalo, scene, imageUrl, from, phone, timestamp })
         │
         ▼
    Return TwiML response:
    "🎨 Noah's art is on the frame!
     H: playing tennis
     L: sad people
     B: making art"
```

---

## TwiML Response Format

All responses are XML-formatted TwiML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>🎨 Noah's art is on the frame!
H: playing tennis
L: sad people
B: making art</Message>
</Response>
```

**Content-Type:** `text/xml`

---

## Error Handling

| Scenario | Response |
|---|---|
| No H/L/B detected | Help text: `Send like this: H playing tennis L sad people B making art` |
| Claude API failure | `Error: Claude scene rewrite failed: <details>` |
| Flux image failure | `Error: Image generation failed: <details>` |
| Blob save failure | `Error: <details>` |

All errors are caught in a try/catch and returned as TwiML messages so the user always gets SMS feedback.

---

## Twilio Configuration

In the Twilio console:
1. Go to **Phone Numbers** → select your number
2. Under **Messaging** → **A Message Comes In**
3. Set webhook URL: `https://frame-art-gold.vercel.app/api/sms`
4. Method: `POST`

---

## Contact Lookup

The `FAMILY_CONTACTS` environment variable maps phone numbers to display names:

```
FAMILY_CONTACTS="+19175192944:Noah,+15551234567:Dad,+15559876543:Mom"
```

If a phone number isn't found, the last 4 digits are used as the name fallback.
