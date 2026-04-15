/**
 * Studio: Generate preview art from a custom headline
 * POST { headline: "..." } — generates truism + owl art, saves to archive only (not latest)
 * Returns the full result for preview in the studio UI
 */
import { generateZeitgeist } from '../../../../lib/transform.js';
import { promptToArt } from '../../../../lib/art.js';
import { saveArtSubmission } from '../../../../lib/storage.js';

export async function POST(request) {
  try {
    const { headline } = await request.json();

    if (!headline || !headline.trim()) {
      return Response.json(
        { success: false, error: 'Headline is required' },
        { status: 400 }
      );
    }

    console.log(`Studio generate: "${headline}"`);

    // 1. Generate zeitgeist from the single headline
    const zeitgeist = await generateZeitgeist([headline.trim()]);
    console.log('Studio zeitgeist:', JSON.stringify(zeitgeist, null, 2));

    // 2. Generate owl art
    const { scene, imageUrl, archiveUrl } = await promptToArt(zeitgeist.imagePrompt);
    console.log(`Studio art: ${archiveUrl}`);

    // 3. Save to archive only (NOT to latest — that's what "release" does)
    const timestamp = new Date().toISOString();
    await saveArtSubmission({
      source: 'studio',
      prompt: zeitgeist.imagePrompt,
      scene,
      headline: zeitgeist.headline,
      truism: zeitgeist.truism,
      newsSource: zeitgeist.source,
      imageUrl,
      archiveUrl,
      from: null,
      phone: null,
      timestamp,
    });

    return Response.json({
      success: true,
      timestamp,
      truism: zeitgeist.truism,
      headline: zeitgeist.headline,
      imagePrompt: zeitgeist.imagePrompt,
      scene,
      archiveUrl,
    });
  } catch (error) {
    console.error('Studio generate failed:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
