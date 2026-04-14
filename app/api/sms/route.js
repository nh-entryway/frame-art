/**
 * Twilio SMS webhook
 * Accepts free-form text, optionally with a caption after a pipe:
 *   "a warship blocking a strait | THE PRICE OF PASSAGE"
 *   "a dog surfing a wave"
 * Generates woodcut art and saves to Blob
 */
import { saveArtSubmission, getFamilyContacts } from '../../../lib/storage.js';
import { promptToArt } from '../../../lib/art.js';
import { generateCaption } from '../../../lib/transform.js';

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

    if (!body) {
      return twimlResponse(`Text me a scene and I'll make a woodcut!\nExample: a wolf howling at the moon | MIDNIGHT CHORUS`);
    }

    // Parse: "prompt | caption" or just "prompt"
    const { prompt, caption } = parseInput(body);

    console.log(`Prompt: "${prompt}" Caption: "${caption || '(auto)'}"`);

    // Generate woodcut art
    const { scene, imageUrl, archiveUrl } = await promptToArt(prompt);

    // Auto-generate caption if not provided
    const finalCaption = caption || await generateCaption(prompt);

    // Save art submission
    await saveArtSubmission({
      source: 'sms',
      prompt,
      scene,
      caption: finalCaption,
      imageUrl,
      archiveUrl,
      from: senderName,
      phone: from,
      timestamp,
    });

    return twimlResponse(`🎨 On the frame!\n${finalCaption}\n— ${senderName}`);

  } catch (error) {
    console.error('SMS webhook error:', error);
    return twimlResponse(`Error: ${error.message}`);
  }
}

/**
 * Parse input text: "prompt | caption" or just "prompt"
 */
function parseInput(text) {
  const pipeIndex = text.indexOf('|');
  if (pipeIndex > 0) {
    return {
      prompt: text.slice(0, pipeIndex).trim(),
      caption: text.slice(pipeIndex + 1).trim().toUpperCase(),
    };
  }
  return { prompt: text.trim(), caption: null };
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
