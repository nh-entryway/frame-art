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
const BFL_API_URL = 'https://api.bfl.ai/v1/flux-2-pro-preview';

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
        content: `You write image editing prompts that transform a woodcut owl portrait into editorial illustrations.

The owl is a great horned owl rendered as a black and white hand-carved relief print — white carved lines on a solid black background, with dense parallel hatching. It faces the viewer head-on in a confrontational portrait.

The theme is: "${prompt}"

Write 2-3 sentences describing how to TRANSFORM this owl to embody the theme. The owl must remain the central subject — recognizable as the same owl — but its context, adornments, or surroundings change to reflect the theme.

Examples of good transformations:
- "The owl is wrapped in heavy iron chains, links coiled around its body and talons. The chains are taut and oppressive. Its eyes stare through the chain links."
- "The owl wears a steel military helmet, slightly tilted. Its feathers are ruffled as if by an explosion's shockwave."
- "The owl's talons grip a crumbling globe, cracks spreading across continents. Pieces fall away into darkness."
- "The owl perches atop a mountain of coins and currency, talons buried in wealth. Bills and coins cascade down the sides."

Rules:
- The owl MUST remain the central subject — do not replace it
- Describe what changes about the owl or what surrounds it
- Keep the black and white carved woodcut relief print style
- Bold, dramatic, immediately readable from across a room
- No background scenes or environments — just the owl and its symbolic elements
- Just output the transformation description, nothing else`,
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
