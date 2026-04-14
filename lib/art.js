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
        content: `You are an art director creating a scene description for a bold woodcut/linocut print. The print will be displayed on an ePaper frame in someone's home.

The subject/prompt is: "${prompt}"

Write a single vivid paragraph (2-3 sentences max) describing ONE dramatic visual scene with a SINGLE dominant subject that fills the entire frame. Think like a printmaker — bold shapes, strong silhouettes, dramatic perspective. The subject should be monumental, confrontational, filling the composition edge to edge.

Rules:
- ONE main subject, not a busy scene with many elements
- Describe it from a dramatic angle (below, very close, looming)
- Focus on form and shape, not fine detail
- Do NOT include any style instructions (like "woodcut" or "black and white")
- Do NOT mention printing technique
- Do NOT use quotation marks or explain what you're doing
- Just output the scene description`,
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
