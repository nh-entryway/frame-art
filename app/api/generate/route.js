/**
 * Generation pipeline API route
 * Triggered by Vercel Cron every hour
 * Scrapes headlines → generates poems → stores in Blob
 */
import { scrapeHeadlines } from '../../../lib/scrape.js';
import { generatePoems } from '../../../lib/transform.js';
import { savePoemData } from '../../../lib/storage.js';

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

    // 2. Generate poems
    console.log('Generating poems...');
    const poems = await generatePoems(headlines);
    console.log('Poems generated:', JSON.stringify(poems, null, 2));

    // 3. Store in Blob
    console.log('Saving to Blob...');
    const saved = await savePoemData(poems);
    console.log('Saved at:', saved.generatedAt);

    return Response.json({
      success: true,
      generatedAt: saved.generatedAt,
      poems: saved,
    });
  } catch (error) {
    console.error('Generation failed:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
