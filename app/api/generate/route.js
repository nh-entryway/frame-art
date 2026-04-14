/**
 * Zeitgeist generation pipeline
 * Triggered by Vercel Cron every hour
 * Scrapes headlines → generates zeitgeist analysis → creates woodcut art → stores in Blob
 */
import { scrapeHeadlines } from '../../../lib/scrape.js';
import { generateZeitgeist } from '../../../lib/transform.js';
import { promptToArt } from '../../../lib/art.js';
import { saveArtSubmission } from '../../../lib/storage.js';

export async function GET(request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. Scrape headlines
    console.log('Scraping headlines...');
    const headlines = await scrapeHeadlines();
    console.log(`Found ${headlines.length} headlines`);

    // 2. Generate zeitgeist analysis (headline + Holzer truism + image prompt)
    console.log('Generating zeitgeist...');
    const zeitgeist = await generateZeitgeist(headlines);
    console.log('Zeitgeist:', JSON.stringify(zeitgeist, null, 2));

    // 3. Generate woodcut art from the image prompt
    console.log('Generating woodcut art...');
    const { scene, imageUrl, archiveUrl } = await promptToArt(zeitgeist.imagePrompt);
    console.log(`Art URL: ${imageUrl}`);

    // 4. Save everything to Blob
    console.log('Saving to Blob...');
    const timestamp = new Date().toISOString();
    const saved = await saveArtSubmission({
      source: 'zeitgeist',
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

    console.log('Saved at:', timestamp);

    return Response.json({
      success: true,
      timestamp,
      zeitgeist,
      imageUrl,
    });
  } catch (error) {
    console.error('Generation failed:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
