/**
 * Art generation pipeline
 * 1. Claude refines a prompt into a vivid scene description
 * 2. Flux generates a bold woodcut/linocut rendering
 * 3. Image is saved to Vercel Blob
 */
import { put } from '@vercel/blob';

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/messages';

// Locked style — bold linocut/woodcut, white carved lines on black ground
const STYLE_PREFIX = `Hand-carved linocut relief print. White carved lines on solid black background. Dense organic hatching and crosshatching with irregular, imperfect hand-carved marks. Thick gouged lines, textural and tactile like a real physical print pulled from a carved block. Simplified powerful forms, not detailed realism. High contrast, stark black and white only. No gray tones, no gradients, no halftones. Museum-quality fine art relief print. The subject fills the entire canvas edge to edge — no white border, no frame, no mat, no margin whatsoever, artwork bleeds to all edges. Raw, physical, monumental.`;

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
        content: `You describe subjects for bold relief prints. Think like a sculptor, not an illustrator.

The subject is: "${prompt}"

Write 2-3 sentences describing ONE object or figure, enormous and close. The subject should be ICONIC — recognizable as a single bold silhouette from 20 feet away. No narrative context, no background scenery, no secondary elements. Just the subject itself, massive, filling every inch of the frame.

Think Brancusi, not Bosch. Think a single clenched fist, not a battle scene. Think one ship bow, not a harbor.

Rules:
- ONE subject only, viewed from a dramatic angle (below, very close, looming overhead)
- Describe form and mass, not fine detail or texture
- No style or technique instructions
- No background, no horizon, no secondary objects
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
 */
export async function generateArt(sceneDescription) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not set');

  const fullPrompt = `${STYLE_PREFIX} Subject: ${sceneDescription}`;

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

  // Step 2: Flux generates the woodcut
  const imageUrl = await generateArt(scene);
  console.log(`Art URL: ${imageUrl}`);

  return { scene, imageUrl };
}
