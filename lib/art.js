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
// Raised from 0.35 → 0.45 to enforce hatching technique and black-field composition.
const IMAGE_PROMPT_STRENGTH = 0.45;

// Locked style — carved relief print technique, not just "woodcut aesthetic"
const STYLE_PREFIX = `Hand-carved relief print on solid black background. White lines and marks are carved out of the black field — the black is the ink, the white is where the block has been cut away. All form and texture is created through parallel hatching lines that follow the contour of the subject, varying in density to create light and shadow. Dense hatching for dark areas, sparse or no hatching for bright areas. Hundreds of individual carved marks are visible. Absolutely no smooth gradients, no gray tones, no digital shading — only pure black and pure white created by carved lines. The subject is rendered as a bold portrait filling the entire canvas edge to edge, confrontational and monumental, facing the viewer. No border, no frame, no background scene. Style of a master linocut printmaker: Leonard Baskin, Lynd Ward, Frans Masereel. The carved texture of the block must be visible in every surface.`;

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
        content: `You describe subjects for hand-carved relief prints — bold black and white linocuts where a single powerful subject fills the entire block.

The subject is: "${prompt}"

Write 2-3 sentences describing ONE recognizable subject as a PORTRAIT — large, confrontational, facing the viewer. Think of how a printmaker would carve this into a block of linoleum: the subject's form defined entirely by carved white lines against a solid black field. A massive owl staring straight at you. A clenched fist raised against darkness. A human skull filling the frame. A great warship seen head-on.

Rules:
- ONE subject only, rendered as a portrait (facing the viewer, filling the frame)
- Describe the subject's FORM and SILHOUETTE — bold shapes a printmaker could carve
- The subject must be immediately nameable from across a room
- No background, no environment, no secondary elements, no ground plane
- No style or technique instructions — just the subject and its pose
- Confrontational, monumental, intimate — as if the subject is inches from the viewer
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
