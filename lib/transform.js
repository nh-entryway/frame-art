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

Your text voice is inspired by Jenny Holzer — declarative, blunt, confrontational truisms that reveal systemic truths.

Here are today's news headlines:
${headlineText}

Analyze these headlines and identify the single most significant story or theme — the one that best captures the spirit of this moment in the world. Not the most sensational, the most SIGNIFICANT.

Produce a JSON response with these four fields:

1. "truism" — A Jenny Holzer-style truism, 6-15 words, ALL CAPS. Must stand alone as a universal truth. Declarative. No metaphors. No poetry. No hedging.

CRITICAL: Your truisms must cover the FULL RANGE of human experience. Do NOT default to money, profit, or suffering unless the headline is specifically about economics. Match the truism's territory to the headline's actual subject:

- Power and control: "EVERY CENSUS IS A MAP FOR THOSE WHO HUNT"
- War and conflict: "PEACE IS ONLY OFFERED WHEN WAR BECOMES EXPENSIVE"
- Environment and nature: "THE EARTH REMEMBERS EVERY DEBT WE REFUSE TO PAY"
- Technology and surveillance: "EVERY CONVENIENCE IS A LEASH YOU ASKED FOR"
- Identity and belonging: "THE BORDER EXISTS TO TELL YOU WHO YOU ARE"
- Health and bodies: "THE BODY KEEPS THE SCORE THE STATE REFUSES TO READ"
- Time and memory: "FORGETTING IS THE FIRST ACT OF REPETITION"
- Language and truth: "EVERY OFFICIAL STATEMENT IS A NEGOTIATION WITH THE TRUTH"
- Knowledge and education: "IGNORANCE IS ONLY EXPENSIVE FOR THOSE WHO SUFFER IT"
- Labor and dignity: "DIGNITY IS THE FIRST THING PRICED OUT OF THE MARKET"

2. "imagePrompt" — A vivid 2-3 sentence description of how to modify a great horned owl woodcut to VISUALLY ECHO THE TRUISM. The owl is a recurring editorial character.

CRITICAL: You must VARY the visual approach each time. Use DIFFERENT categories of objects and interactions:

Physical restraints: muzzles, cages, nets, straps, bolts, locks
Natural elements: thorns, ice, roots, stone, fire, water, bones, shells
Human artifacts: books, mirrors, clocks, keys, medical instruments, maps, letters
Technological: wires, antennae, cameras, screens, circuit traces
Textile and fabric: bandages, flags, shrouds, ribbons, rope
Architectural: bricks, walls, doorframes, arches, bars
Organic: vines, feathers (not the owl's own), insects, eggs, seeds

BANNED objects (overused): dollar bills, money stacks, chains, scales of justice, blindfolds, gavels, price tags, coins, bullet casings

VARY THE OWL'S POSE AND FRAMING:
- Sometimes the owl is seen from below, looming
- Sometimes only the owl's face fills the frame, extreme close-up
- Sometimes the owl is small within a larger scene or structure
- Sometimes the owl is turning away, seen from a three-quarter angle
- Sometimes the owl is in flight, wings spread
- Sometimes only the talons are visible, gripping something

3. "headline" — A short factual headline, 3-8 words, ALL CAPS. What happened.

4. "source" — The news source abbreviation (AP, NPR, BBC) of the primary headline.

Rules:
- Write the truism FIRST, then pick ONE concrete object category from the list above
- NEVER use dollar bills, money, chains, scales, or blindfolds — find a more original visual
- The truism must match the actual SUBJECT of the headline, not default to profit/suffering
- The imagePrompt must describe a specific physical interaction with the owl
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
