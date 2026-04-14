/**
 * Art generation pipeline
 * 1. Claude refines a prompt into a vivid scene description
 * 2. Flux generates a woodcut using the owl as a style reference
 * 3. Image is saved to Vercel Blob
 *
 * Style Reference Architecture:
 * - A curated woodcut image (the "owl") is stored in Blob at art/owl-reference.png
 * - Every generation passes this image as `imagePrompt` via providerOptions
 * - `imagePromptStrength` controls how much the owl's organic linework influences output
 * - This uses the Vercel AI Gateway (bfl/flux-2-pro) — no separate BFL API key needed
 *
 * See: https://ai-sdk.dev/providers/ai-sdk-providers/black-forest-labs#provider-options
 */
import { put, list } from '@vercel/blob';

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/messages';

// Path to the style reference image in Vercel Blob
const OWL_REFERENCE_BLOB_PATH = 'art/owl-reference.png';

// How strongly the owl's style influences generation (0.0–1.0)
// Lower = more freedom for new subjects. Higher = more owl-like texture.
// 0.3–0.5 is the sweet spot: organic linework without copying the owl subject.
const IMAGE_PROMPT_STRENGTH = 0.35;

// Locked style — bold woodcut, graphic contrast, recognizable subjects
const STYLE_PREFIX = `Bold black and white woodcut print. Stark graphic contrast with simplified powerful shapes. The subject must be immediately recognizable — not abstract, not mechanical, not decorative. Pure black and pure white only, no gray tones. Bold lines, large solid areas of black and white. The subject fills the entire canvas edge to edge with no border, no frame, no margin. Style of a powerful 1930s relief print or protest poster. Monumental and confrontational.`;

/**
 * Fetch the owl reference image from Blob and return as base64
 * Returns null if the owl hasn't been uploaded yet (graceful fallback)
 */
async function getOwlReferenceBase64() {
  try {
    const { blobs } = await list({ prefix: OWL_REFERENCE_BLOB_PATH });
    if (blobs.length === 0) {
      console.log('No owl reference image found — generating without style reference');
      return null;
    }

    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) {
      console.log('Failed to fetch owl reference image');
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.toString('base64');
  } catch (e) {
    console.error('Error loading owl reference:', e.message);
    return null;
  }
}

/**
 * Use Claude to refine a prompt into a vivid scene description
 * for a single bold woodcut subject
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
        content: `You describe subjects for bold black and white prints.

The subject is: "${prompt}"

Write 2-3 sentences describing ONE recognizable subject, large and dramatic. The viewer should be able to identify what it is from across a room — a warship, a clenched fist, a padlocked gate, a wall of flame. NOT abstract, NOT mechanical details, NOT texture. A clear, powerful image that someone would understand immediately.

Rules:
- ONE recognizable subject that a viewer can NAME (a ship, a hand, a chain, a face)
- Describe it simply and directly — what it IS, not what it looks like in detail
- Dramatic angle or scale (enormous, looming, filling the frame)
- No small details, no background, no secondary elements
- No style or technique instructions
- Just output the scene description, nothing else`,
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
 * Generate art using AI Gateway (Flux 2 Pro)
 * Produces a portrait-oriented woodcut at ~3:4 ratio
 *
 * If the owl reference image exists in Blob, it's passed as `imagePrompt`
 * via providerOptions.blackForestLabs — this gives Flux the organic,
 * hand-carved linework quality of the reference without copying its subject.
 */
export async function generateArt(sceneDescription) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not set');

  const fullPrompt = `${STYLE_PREFIX} Subject: ${sceneDescription}`;

  // Load the owl reference image for style transfer
  const owlBase64 = await getOwlReferenceBase64();

  // Build provider options — always include output format,
  // add imagePrompt only if the owl is available
  const providerOpts = {
    outputFormat: 'png',
  };
  if (owlBase64) {
    providerOpts.imagePrompt = owlBase64;
    providerOpts.imagePromptStrength = IMAGE_PROMPT_STRENGTH;
    console.log(`Using owl reference image (strength: ${IMAGE_PROMPT_STRENGTH})`);
  }

  const res = await fetch('https://ai-gateway.vercel.sh/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'bfl/flux-2-pro',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1408',
      response_format: 'b64_json',
      providerOptions: {
        blackForestLabs: providerOpts,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image generation failed: ${err}`);
  }

  const data = await res.json();

  // Decode base64 image
  const b64 = data.data[0].b64_json;
  const imageBuffer = Buffer.from(b64, 'base64');
  const timestamp = Date.now();

  const blob = await put(`art/latest.png`, imageBuffer, {
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

/**
 * Full pipeline: prompt → scene → art → blob
 */
export async function promptToArt(prompt) {
  console.log(`Art pipeline: prompt="${prompt}"`);

  // Step 1: Claude refines into a scene
  const scene = await rewriteAsScene(prompt);
  console.log(`Scene: ${scene}`);

  // Step 2: Flux generates the woodcut (with owl style reference if available)
  const imageUrl = await generateArt(scene);
  console.log(`Art URL: ${imageUrl}`);

  return { scene, imageUrl };
}
