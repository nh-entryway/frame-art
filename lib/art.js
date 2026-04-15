/**
 * Art generation pipeline — Owl as Editorial Character
 *
 * 1. Claude describes how to transform the owl for this headline
 * 2. FLUX.2 (BFL direct API) transforms the owl image to match
 * 3. Result is saved to Vercel Blob
 *
 * Architecture:
 * - The owl woodcut (art/owl-reference.png in Blob) is the recurring character
 * - Every generation sends the owl as `input_image` to FLUX.2
 * - FLUX.2 transforms the owl to embody the headline/truism
 * - The owl's identity (gaze, carved linework, portrait composition) persists
 * - Claude writes transformation prompts, not standalone subject descriptions
 *
 * API: BFL direct (https://api.bfl.ai) — async polling pattern
 * Auth: BFL_API_KEY (separate from AI_GATEWAY_API_KEY)
 */
import { put, list } from '@vercel/blob';
import sharp from 'sharp';

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/messages';
const BFL_API_URL = 'https://api.bfl.ai/v1/flux-2-max';

// Path to the owl reference image in Vercel Blob
const OWL_REFERENCE_BLOB_PATH = 'art/owl-reference.png';

// How long to wait for BFL to finish generating (ms)
const BFL_TIMEOUT_MS = 120_000;
// How often to poll for results (ms)
const BFL_POLL_INTERVAL_MS = 1500;

/**
 * Get the public URL for the owl reference image from Blob
 * Returns null if the owl hasn't been uploaded yet (graceful fallback)
 */
async function getOwlReferenceUrl() {
  try {
    const { blobs } = await list({ prefix: OWL_REFERENCE_BLOB_PATH });
    if (blobs.length === 0) {
      console.log('No owl reference image found — cannot generate owl transformation');
      return null;
    }
    return blobs[0].url;
  } catch (e) {
    console.error('Error finding owl reference:', e.message);
    return null;
  }
}

/**
 * Use Claude to describe how to transform the owl for this prompt.
 * Instead of describing a standalone subject, Claude describes
 * how the owl should be modified to embody the theme.
 */
export async function rewriteAsScene(prompt) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not set');

  const res = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You write short FLUX.2 image editing prompts. The input image is a great horned owl — black and white hand-carved woodcut relief print, facing the viewer.

Theme: "${prompt}"

Write ONE short editing prompt (1-2 sentences, under 50 words). Describe how the prop physically interacts with the owl's body — wrapping around it, pressing into feathers, gripped in talons, draped over shoulders. Props should have dimensional depth — passing in front of AND behind the owl's body to create volume and layering.

VARY THE COMPOSITION — do not always use the standard frontal portrait:
- Extreme close-up of the owl's face with objects pressing against it
- View from below, the owl looming overhead
- The owl in three-quarter profile, turning away
- Only the talons visible, gripping something
- The owl mid-flight, wings spread

Good examples:
- "Extreme close-up of the owl's face. A cracked mirror fragment reflects a distorted version of the owl's eye. Black and white woodcut with dimensional depth."
- "The owl seen from below, wings half-spread, casting a shadow. Tangled roots grow up from beneath, wrapping around its talons. Black and white woodcut style, no color."
- "Thick bandages wrap the owl's head, covering one eye. A medical syringe is clenched in one talon. Black and white woodcut, no color."
- "The owl perches inside the frame of a broken window, shattered glass radiating outward. Three-quarter angle. Black and white woodcut style, no color."

BANNED (overused): dollar bills, money, chains, scales, blindfolds, gavels, price tags, coins.

Rules:
- Keep it SHORT — under 50 words
- Describe PHYSICAL CONTACT: wrapping, pressing, gripping, coiling, piercing, draping, emerging from, shattering, growing through
- Props should have DEPTH — wrapping around the owl in 3D, not flat overlays
- End with: "Black and white woodcut style, no color."
- Output ONLY the prompt, nothing else`,
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude scene rewrite failed: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text.trim();
}

/**
 * Generate art using BFL direct API (FLUX.2 image editing)
 *
 * Sends the owl reference image as `input_image` and the scene
 * description as `prompt`. FLUX.2 transforms the owl to match.
 *
 * Uses async polling: POST → get polling_url → poll until Ready
 */
export async function generateArt(sceneDescription) {
  const bflKey = process.env.BFL_API_KEY;
  if (!bflKey) throw new Error('BFL_API_KEY not set');

  // Get the owl reference URL from Blob
  const owlUrl = await getOwlReferenceUrl();
  if (!owlUrl) {
    throw new Error('Owl reference image not found in Blob — cannot generate');
  }

  console.log(`Submitting to BFL FLUX.2: owl=${owlUrl}`);
  console.log(`Prompt: ${sceneDescription}`);

  // Step 1: Submit generation request
  const submitRes = await fetch(BFL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-key': bflKey,
      'accept': 'application/json',
    },
    body: JSON.stringify({
      prompt: sceneDescription,
      input_image: owlUrl,
      width: 1024,
      height: 1408,
      output_format: 'png',
      safety_tolerance: 6,
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`BFL submit failed (${submitRes.status}): ${err}`);
  }

  const submitData = await submitRes.json();
  const pollingUrl = submitData.polling_url;
  console.log(`BFL job submitted: ${submitData.id}`);

  // Step 2: Poll for result
  const startTime = Date.now();
  while (Date.now() - startTime < BFL_TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, BFL_POLL_INTERVAL_MS));

    const pollRes = await fetch(pollingUrl, {
      headers: {
        'accept': 'application/json',
        'x-key': bflKey,
      },
    });

    if (!pollRes.ok) {
      console.log(`Poll returned ${pollRes.status}, retrying...`);
      continue;
    }

    const pollData = await pollRes.json();
    console.log(`BFL status: ${pollData.status}`);

    if (pollData.status === 'Ready') {
      const imageUrl = pollData.result.sample;
      console.log(`BFL generation complete: ${imageUrl}`);

      // Step 3: Download the generated image and upload to Blob
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        throw new Error(`Failed to download generated image from BFL`);
      }
      const rawBuffer = Buffer.from(await imageRes.arrayBuffer());

      // Force grayscale — FLUX.2 sometimes adds color to metallic objects
      const imageBuffer = await sharp(rawBuffer)
        .grayscale()
        .png()
        .toBuffer();
      console.log('Converted to grayscale');

      const timestamp = Date.now();

      const latestBlob = await put('art/latest.png', imageBuffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/png',
      });

      // Also archive with unique URL
      const archiveBlob = await put(`art/archive/${timestamp}.png`, imageBuffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/png',
      });

      return { latestUrl: latestBlob.url, archiveUrl: archiveBlob.url };
    }

    if (pollData.status === 'Error' || pollData.status === 'Failed') {
      throw new Error(`BFL generation failed: ${JSON.stringify(pollData)}`);
    }
  }

  throw new Error(`BFL generation timed out after ${BFL_TIMEOUT_MS / 1000}s`);
}

/**
 * Full pipeline: prompt → owl transformation description → FLUX.2 edit → blob
 */
export async function promptToArt(prompt) {
  console.log(`Art pipeline: prompt="${prompt}"`);

  // Step 1: Claude describes how to transform the owl
  const scene = await rewriteAsScene(prompt);
  console.log(`Owl transformation: ${scene}`);

  // Step 2: FLUX.2 transforms the owl image
  const { latestUrl, archiveUrl } = await generateArt(scene);
  console.log(`Art latest: ${latestUrl}`);
  console.log(`Art archive: ${archiveUrl}`);

  return { scene, imageUrl: latestUrl, archiveUrl };
}
