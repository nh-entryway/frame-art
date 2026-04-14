/**
 * API: Pin/unpin an image to the frame
 * POST { timestamp } — pin that archive entry
 * POST { timestamp: null } — unpin, resume auto-updates
 */
import { getSettings, saveSettings } from '../../../lib/settings.js';

export async function POST(request) {
  try {
    const { timestamp } = await request.json();
    const settings = await getSettings();
    settings.pinnedTimestamp = timestamp || null;
    await saveSettings(settings);

    return Response.json({
      success: true,
      pinned: settings.pinnedTimestamp,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
