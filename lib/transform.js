/**
 * AI poem generator
 * Uses Claude Sonnet via Vercel AI Gateway to transform headlines
 * into High / Low / Buffalo poetry
 */

const AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/messages';

export async function generatePoems(headlines) {
  const headlineText = headlines.map(h => `- ${h.title} (${h.source})`).join('\n');

  const prompt = `You are a poet creating work for an ePaper display in a home entryway. The viewer glances at it throughout the day.

Here are today's news headlines:
${headlineText}

Create three short poems (exactly 3 lines each) in the "High Low Buffalo" format:

HIGH — Choose the most hopeful, optimistic, or beautiful headline. Write a 3-line poem that captures its essence. Transform the news language into something felt, imagistic, concrete. No abstraction.

LOW — Choose the most troubling, sad, or concerning headline. Write a 3-line poem. Be honest about difficulty without being nihilistic. Find the human in the headline.

BUFFALO — Choose the most surprising, weird, absurd, or unexpected headline. Write a 3-line poem in a slightly wry, wondering tone. Embrace the strangeness.

Rules:
- Each poem is EXACTLY 3 lines
- No titles, no labels, no quotation marks
- No rhyming
- Each line should work as a standalone image
- Be specific — use nouns from the headlines, not abstractions
- Maximum 12 words per line

Respond in this exact JSON format and nothing else:
{
  "high": { "line1": "...", "line2": "...", "line3": "...", "source": "..." },
  "low": { "line1": "...", "line2": "...", "line3": "...", "source": "..." },
  "buffalo": { "line1": "...", "line2": "...", "line3": "...", "source": "..." }
}

For "source", use the news source abbreviation (AP, NPR, or BBC) of the headline you chose.`;

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
      model: 'anthropic/claude-sonnet-4-20250514',
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
