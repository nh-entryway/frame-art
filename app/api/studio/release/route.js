/**
 * Studio: Release a preview to the frame
 * POST { timestamp, archiveUrl, truism, headline, scene } — publishes to latest
 */
import { put } from '@vercel/blob';

export async function POST(request) {
  try {
    const data = await request.json();
    const { timestamp, archiveUrl, truism, headline, scene } = data;

    if (!timestamp || !archiveUrl) {
      return Response.json(
        { success: false, error: 'timestamp and archiveUrl required' },
        { status: 400 }
      );
    }

    console.log(`Studio release: "${truism}" at ${timestamp}`);

    // Download the archive image and copy to latest.png
    const imageRes = await fetch(archiveUrl);
    if (!imageRes.ok) throw new Error('Failed to fetch archive image');
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    const blob = await put('art/latest.png', imageBuffer, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'image/png',
    });

    // Update latest.json metadata
    const payload = {
      mode: 'art',
      source: 'studio',
      truism,
      headline,
      scene,
      imageUrl: blob.url,
      archiveUrl,
      timestamp,
    };

    await put('art/latest.json', JSON.stringify(payload, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });

    return Response.json({ success: true, imageUrl: blob.url });
  } catch (error) {
    console.error('Studio release failed:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
