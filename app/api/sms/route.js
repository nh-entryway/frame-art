/**
 * Twilio SMS webhook
 * Accepts: "H playing tennis L sad people B making art"
 * Parses H/L/B, generates charcoal art, saves to Blob
 */
import { saveArtSubmission, getFamilyContacts } from '../../../lib/storage.js';
import { hlbToArt } from '../../../lib/art.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const body = (formData.get('Body') || '').trim();
    const from = formData.get('From') || '';
    const timestamp = new Date().toISOString();

    console.log(`SMS from ${from}: ${body}`);

    // Look up sender name
    const contacts = getFamilyContacts();
    const senderName = contacts[from] || from.slice(-4);

    // Parse H/L/B from text
    // Supports formats like:
    //   "H playing tennis L sad people B making art"
    //   "HIGH playing tennis LOW sad people BUFFALO making art"
    const parsed = parseHLB(body);

    if (!parsed.high && !parsed.low && !parsed.buffalo) {
      return twimlResponse(`Send like this:\nH playing tennis L sad people B making art`);
    }

    console.log(`Parsed: H="${parsed.high}" L="${parsed.low}" B="${parsed.buffalo}"`);

    // Generate charcoal art from H/L/B
    const { scene, imageUrl } = await hlbToArt(parsed);

    // Save art submission with all metadata
    await saveArtSubmission({
      high: parsed.high,
      low: parsed.low,
      buffalo: parsed.buffalo,
      scene,
      imageUrl,
      from: senderName,
      phone: from,
      timestamp,
    });

    const parts = [];
    if (parsed.high) parts.push(`H: ${parsed.high}`);
    if (parsed.low) parts.push(`L: ${parsed.low}`);
    if (parsed.buffalo) parts.push(`B: ${parsed.buffalo}`);

    return twimlResponse(`🎨 ${senderName}'s art is on the frame!\n${parts.join('\n')}`);

  } catch (error) {
    console.error('SMS webhook error:', error);
    return twimlResponse(`Error: ${error.message}`);
  }
}

/**
 * Parse H/L/B from a text message
 * "H playing tennis L sad people B making art"
 */
function parseHLB(text) {
  const result = { high: null, low: null, buffalo: null };

  // Normalize: support both short (H/L/B) and long (HIGH/LOW/BUFFALO) forms
  // Use regex to find each section
  const normalized = text.replace(/\n/g, ' ');

  // Match patterns: H/HIGH ... (until next H/L/B or end)
  const hMatch = normalized.match(/\b(?:H|HIGH)[:\s]+(.+?)(?=\s+(?:L|LOW|B|BUFFALO)\b|$)/i);
  const lMatch = normalized.match(/\b(?:L|LOW)[:\s]+(.+?)(?=\s+(?:H|HIGH|B|BUFFALO)\b|$)/i);
  const bMatch = normalized.match(/\b(?:B|BUFFALO)[:\s]+(.+?)(?=\s+(?:H|HIGH|L|LOW)\b|$)/i);

  if (hMatch) result.high = hMatch[1].trim();
  if (lMatch) result.low = lMatch[1].trim();
  if (bMatch) result.buffalo = bMatch[1].trim();

  return result;
}

function twimlResponse(message) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
