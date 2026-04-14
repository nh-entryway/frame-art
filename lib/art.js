/**
 * Art generation pipeline
 * 1. Claude rewrites casual text into an art-worthy scene description
 * 2. DALL-E generates the image with a locked charcoal style prefix
 * 3. Image is saved to Vercel Blob
 */
import { put } from '@vercel/blob';

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/messages';

// Locked style — Robert Longo-inspired hyper-realistic charcoal
const STYLE_PREFIX = `Hyper-realistic large-scale charcoal and graphite drawing on white paper in the tradition of Robert Longo. Photorealistic with extreme meticulous detail. Deep velvety blacks in the shadows, luminous bright whites where light hits. Dramatic, monumental, cinematic composition. The charcoal medium is visible — smudged darks, crisp graphite highlights, the grain of heavy paper showing through. Museum quality fine art drawing, not illustration. No color whatsoever, pure black and white charcoal. Portrait orientation.`;

/**
 * Use Claude to rewrite casual family text into an art-worthy scene
 */
export async function rewriteAsScene(text) {
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
        content: `You are an art director translating someone's text message into a vivid scene description for a charcoal drawing. 

The person texted: "${text}"

Write a single, vivid paragraph (2-3 sentences max) describing a dramatic visual scene that captures the emotion and subject of their message. Think cinematically — describe lighting, composition, perspective. Be specific and visual, not abstract.

Do NOT include any style instructions (like "charcoal" or "black and white") — just describe the scene itself. Do NOT use quotation marks. Do NOT explain what you're doing. Just output the scene description.`,
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
 * Generate art using AI Gateway (supports DALL-E 3, Flux, etc.)
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
 * Full pipeline: text → scene → art → blob
 */
export async function textToArt(text) {
  console.log(`Art pipeline: "${text}"`);

  // Step 1: Claude rewrites the text into a scene
  const scene = await rewriteAsScene(text);
  console.log(`Scene: ${scene}`);

  // Step 2: DALL-E generates the charcoal art
  const imageUrl = await generateArt(scene);
  console.log(`Art URL: ${imageUrl}`);

  return { scene, imageUrl };
}
