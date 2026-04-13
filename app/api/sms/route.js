/**
 * Twilio SMS webhook
 * Receives incoming texts, parses HIGH/LOW/BUFFALO submissions,
 * stores them for display on the frame
 */
import { saveFamilySubmission, getFamilyContacts } from '../../../lib/storage.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const body = formData.get('Body') || '';
    const from = formData.get('From') || '';
    const timestamp = new Date().toISOString();

    console.log(`SMS from ${from}: ${body}`);

    // Look up sender name from contacts mapping
    const contacts = getFamilyContacts();
    const senderName = contacts[from] || from.slice(-4); // last 4 digits as fallback

    // Parse the message - support formats:
    // "HIGH Got a promotion today"
    // "LOW Traffic was brutal"
    // "BUFFALO Found a turtle in the mailbox"
    // Or all three separated by newlines
    const lines = body.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const submissions = [];

    for (const line of lines) {
      const match = line.match(/^(HIGH|LOW|BUFFALO)[:\s]+(.+)/i);
      if (match) {
        submissions.push({
          category: match[1].toUpperCase(),
          text: match[2].trim(),
          from: senderName,
          phone: from,
          timestamp,
        });
      }
    }

    // If no structured format detected, treat the whole message as a single submission
    // and ask which category
    if (submissions.length === 0) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>📝 Got it! Start your text with HIGH, LOW, or BUFFALO followed by your message. Example:
HIGH Got a promotion today!
LOW Traffic was awful
BUFFALO Found a turtle in the mailbox</Message>
</Response>`;
      return new Response(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Save each submission
    for (const sub of submissions) {
      await saveFamilySubmission(sub);
    }

    // Build confirmation message
    const categories = submissions.map(s => s.category).join(', ');
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>✅ ${senderName}'s ${categories} ${submissions.length > 1 ? 'are' : 'is'} on the frame!</Message>
</Response>`;

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('SMS webhook error:', error);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Something went wrong. Try again!</Message>
</Response>`;
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
