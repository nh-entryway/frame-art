/**
 * Art generation pipeline
 * 1. Claude combines H/L/B submissions into a unified scene
 * 2. Flux generates a charcoal rendering
 * 3. Image is saved to Vercel Blob
 */
import { put } from '@vercel/blob';

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/messages';

// Locked style — Robert Longo-inspired hyper-realistic charcoal
const STYLE_PREFIX = `Hyper-realistic large-scale charcoal and graphite drawing on white paper. Photorealistic with extreme meticulous detail. Deep velvety blacks in the shadows, luminous bright whites where light hits. Dramatic, monumental, cinematic composition. The charcoal medium is visible — smudged darks, crisp graphite highlights, the grain of heavy paper showing through. Museum quality fine art drawing, not illustration. No color whatsoever, pure black and white charcoal.`;

/**
 * Use Claude to combine H/L/B into a unified scene description
 */
export async function rewriteAsScene({ high, low, buffalo }) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not set');

  const parts = [];
  if (high) parts.push(`HIGH (a joy/positive): "${high}"`);
  if (low) parts.push(`LOW (a sadness/struggle): "${low}"`);
  if (buffalo) parts.push(`BUFFALO (something wild/absurd): "${buffalo}"`);

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
        content: `You are an art director creating a single, unified visual scene for a charcoal drawing that weaves together these three moments from someone's day:

${parts.join('\n')}

Write a single vivid paragraph (2-3 sentences max) describing ONE dramatic visual scene that elegantly combines all these themes into a cohesive image. Think cinematically — describe lighting, composition, perspective, specific objects and figures. The scene should feel emotionally rich and layered, not literal.

Do NOT include any style instructions (like "charcoal" or "black and white"). Do NOT use quotation marks. Do NOT explain what you're doing. Just output the scene description.`,
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
 * Full pipeline: H/L/B → scene → art → blob
 */
export async function hlbToArt({ high, low, buffalo }) {
  console.log(`Art pipeline: H="${high}" L="${low}" B="${buffalo}"`);

  // Step 1: Claude combines into a unified scene
  const scene = await rewriteAsScene({ high, low, buffalo });
  console.log(`Scene: ${scene}`);

  // Step 2: Flux generates the charcoal art
  const imageUrl = await generateArt(scene);
  console.log(`Art URL: ${imageUrl}`);

  return { scene, imageUrl };
}
