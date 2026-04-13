/**
 * RSS headline scraper
 * Fetches top headlines from AP, NPR, and BBC RSS feeds
 */

const FEEDS = [
  { name: 'AP', url: 'https://rsshub.app/apnews/topics/apf-topnews' },
  { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
];

function extractTitles(xml) {
  const titles = [];
  const regex = /<item[^>]*>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>|<item[^>]*>[\s\S]*?<title>(.*?)<\/title>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const title = (match[1] || match[2] || '').trim();
    if (title && title.length > 10) {
      titles.push(title);
    }
  }
  return titles.slice(0, 5); // top 5 per feed
}

export async function scrapeHeadlines() {
  const results = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'FrameArt/1.0' },
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const titles = extractTitles(xml);
      titles.forEach(title => results.push({ title, source: feed.name }));
    } catch (e) {
      console.error(`Failed to fetch ${feed.name}:`, e.message);
    }
  }

  // Fallback if all feeds fail
  if (results.length === 0) {
    return [
      { title: 'The world continues turning', source: 'FALLBACK' },
      { title: 'Somewhere the sun is rising', source: 'FALLBACK' },
      { title: 'A cat sits in a window', source: 'FALLBACK' },
    ];
  }

  return results;
}
