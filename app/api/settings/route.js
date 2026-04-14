/**
 * API: Toggle generation on/off
 * POST { generateEnabled: true/false }
 */
import { getSettings, saveSettings } from '../../../lib/settings.js';

export async function POST(request) {
  try {
    const { generateEnabled } = await request.json();
    const settings = await getSettings();
    settings.generateEnabled = !!generateEnabled;
    await saveSettings(settings);

    return Response.json({
      success: true,
      generateEnabled: settings.generateEnabled,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json(settings);
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
