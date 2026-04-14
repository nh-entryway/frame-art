/**
 * Twilio SMS webhook
 * - Text starting with HIGH/LOW/BUFFALO → poem mode (v2)
 * - Any other text → art mode (v3) — generates charcoal art from the message
 */
import { saveFamilySubmission, getFamilyContacts, saveArtSubmission } from '../../../lib/storage.js';
import { textToArt } from '../../../lib/art.js';

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

    // Check if it's a structured HLB submission
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
    const hlbSubmissions = [];

    for (const line of lines) {
      const match = line.match(/^(HIGH|LOW|BUFFALO)[:\s]+(.+)/i);
      if (match) {
        hlbSubmissions.push({
          category: match[1].toUpperCase(),
          text: match[2].trim(),
          from: senderName,
          phone: from,
          timestamp,
        });
      }
    }

    // If structured HLB format → poem mode
    if (hlbSubmissions.length > 0) {
      for (const sub of hlbSubmissions) {
        await saveFamilySubmission(sub);
      }
      const categories = hlbSubmissions.map(s => s.category).join(', ');
      return twimlResponse(`✅ ${senderName}'s ${categories} ${hlbSubmissions.length > 1 ? 'are' : 'is'} on the frame!`);
    }

    // Otherwise → art mode: generate charcoal art from the text
    // Send immediate acknowledgment, then generate async
    console.log(`Art mode for ${senderName}: "${body}"`);

    // Generate the art (this takes ~15-30 seconds)
    const { scene, imageUrl } = await textToArt(body);

    // Save the art submission
    await saveArtSubmission({
      text: body,
      scene,
      imageUrl,
      from: senderName,
      phone: from,
      timestamp,
    });

    return twimlResponse(`🎨 ${senderName}, your art is on the frame!\n\n"${body}"`);

  } catch (error) {
    console.error('SMS webhook error:', error);
    return twimlResponse(`Error: ${error.message}`);
  }
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
