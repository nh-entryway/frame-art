/**
 * Zeitgeist generator
 * Uses Claude to analyze headlines and produce:
 * 1. A bold woodcut image prompt (single dominant subject)
 * 2. A factual headline (what happened)
 * 3. A Holzer-style truism (what it reveals)
 */

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/messages';

export async function generateZeitgeist(headlines) {
  const headlineText = headlines.map(h => `- ${h.title} (${h.source})`).join('\n');

  const prompt = `You are an editorial illustrator and writer for a daily art frame — a physical ePaper display in someone's home that shows a bold woodcut image alongside text about the state of the world.

Your text voice is inspired by Jenny Holzer — declarative, blunt, confrontational truisms that reveal systemic truths about power, money, and human nature.

Here are today's news headlines:
${headlineText}

Analyze these headlines and identify the single most significant story or theme — the one that best captures the spirit of this moment in the world. Not the most sensational, the most SIGNIFICANT.

Produce a JSON response with these four fields:

1. "truism" — A Jenny Holzer-style truism, 6-15 words, ALL CAPS. What this moment reveals about power, systems, or human nature. Must stand alone as a universal truth, not just a comment on the headline. Declarative. No metaphors. No poetry. No hedging. Examples: "THE PRICE OF FUEL IS THE PRICE OF OBEDIENCE", "EVERY EMPIRE CALLS ITS WARS NECESSARY", "PEACE IS ONLY OFFERED WHEN WAR BECOMES EXPENSIVE"

2. "imagePrompt" — A vivid 2-3 sentence description of how to modify a great horned owl woodcut to VISUALLY ECHO THE TRUISM. The owl is a recurring editorial character — a carved black and white relief print portrait, facing the viewer head-on. Add objects, adornments, or symbolic elements to the owl that a viewer INSTANTLY connects to the truism's meaning — no interpretation needed. The symbol should make the truism feel inevitable.

Examples of strong truism → image pairings:
- Truism "EVERY BORDER IS A SCAR THAT NEVER HEALED" → "Wrap the owl in coils of barbed wire, the barbs pressing into its feathers and drawing thin lines of ink."
- Truism "OBEDIENCE IS THE MOST COMFORTABLE PRISON" → "Place a heavy iron muzzle over the owl's beak, bolted shut. Add a chain leash hanging from a collar around its neck."
- Truism "THE PRICE OF FUEL IS THE PRICE OF OBEDIENCE" → "The owl grips an oil-slicked pipeline in its talons, thick black crude dripping down between its claws."
- Truism "WAR IS THE MOST PROFITABLE FORM OF SUFFERING" → "Stack spent bullet casings around the owl's talons like a pile of coins. A single price tag hangs from the owl's neck."

The owl must REMAIN the central subject. No backgrounds or environments. Do NOT mention art style or technique. The added objects must be LITERAL and CONCRETE — not abstract or mechanical.

3. "headline" — A short factual headline, 3-8 words, ALL CAPS. What happened. Examples: "HORMUZ BLOCKADE — DAY 12", "GAZA CEASEFIRE REJECTED"

4. "source" — The news source abbreviation (AP, NPR, BBC) of the primary headline.

Rules:
- Write the truism FIRST, then pick ONE concrete object that makes the truism visible
- The imagePrompt must make the truism feel obvious — a viewer should understand the truism just by looking at the owl
- Use literal, recognizable objects (chains, barbed wire, money, weapons, masks) not abstract symbols (gears, fractals, swirls)
- The truism must feel true beyond today's news — carved into a building
- The headline must be factual and clear
- The imagePrompt must keep the owl as the central subject — add to it, don't replace it
- Respond with ONLY the JSON object, nothing else

Respond in this exact JSON format:
{
  "imagePrompt": "...",
  "headline": "...",
  "truism": "...",
  "source": "..."
}`;

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error('AI_GATEWAY_API_KEY not set');
  }

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI Gateway error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate a caption for user-submitted SMS prompts
 * when the user doesn't provide their own caption
 */
export async function generateCaption(prompt) {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not set');

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Write a short, bold caption (3-8 words, ALL CAPS) for this image prompt: "${prompt}". The caption should be declarative and evocative, like a title for a fine art print. Output ONLY the caption text, nothing else.`,
      }],
    }),
  });

  if (!response.ok) {
    // Fallback: use the prompt itself
    return prompt.toUpperCase().slice(0, 60);
  }

  const data = await response.json();
  return (data.content?.[0]?.text || prompt).trim().toUpperCase();
}
