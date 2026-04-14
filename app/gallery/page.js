import { getArchivedArt } from '../../lib/storage.js';
import { getSettings } from '../../lib/settings.js';
import GalleryClient from './GalleryClient.js';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const [items, settings] = await Promise.all([
    getArchivedArt(),
    getSettings(),
  ]);

  // Sort oldest first
  const sorted = [...items].reverse();

  return <GalleryClient items={sorted} settings={settings} />;
}
