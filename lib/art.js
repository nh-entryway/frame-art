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
        content: `You write FLUX.2 image editing prompts. Your prompts will be sent directly to a FLUX.2 model along with an input image of a great horned owl — a black and white hand-carved relief print portrait with dense parallel hatching on a solid black background.

The theme to illustrate: "${prompt}"

Write a single editing prompt (2-3 sentences) that tells FLUX.2 what to ADD or CHANGE on the owl image. Use controlled edit language — say exactly what elements to add, where to place them, and what to preserve.

Good prompt examples:
- "Add heavy iron chains wrapped around the owl's body and talons. The chains are taut and oppressive, with individual links visible. Maintain the same black and white woodcut relief print style, the owl's pose, and its direct gaze at the viewer."
- "Place a steel military helmet on the owl's head, slightly tilted to one side. Add ruffled feathers as if from an explosion's shockwave. Keep the carved black and white relief print style and the owl's confrontational expression."
- "Change the owl's talons to grip a crumbling globe with cracks spreading across continents. Pieces fall away into solid black. Preserve the hand-carved woodcut line work, the black background, and the owl's identity."

Rules:
- Use direct editing language: "Add...", "Place...", "Change...", "Wrap the owl in..."
- Always end with what to PRESERVE: "Maintain the black and white carved woodcut style, the owl's pose, and its direct gaze"
- The owl must remain the central subject in the exact same position and scale
- Bold, dramatic elements immediately readable from across a room
- No background scenes or environments — just the owl and its symbolic elements
- Output ONLY the editing prompt, nothing else`,
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
      const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
      const timestamp = Date.now();

      const blob = await put('art/latest.png', imageBuffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/png',
      });

      // Also archive
      await put(`art/archive/${timestamp}.png`, imageBuffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/png',
      });

      return blob.url;
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
  const imageUrl = await generateArt(scene);
  console.log(`Art URL: ${imageUrl}`);

  return { scene, imageUrl };
}
