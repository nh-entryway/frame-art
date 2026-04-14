import { getLatestPoem, getLatestArt } from '../../lib/storage.js';

export const dynamic = 'force-dynamic';

// Fallback poems when no data in Blob yet
const FALLBACK = {
  high: { line1: 'Solar farms now outpace coal', line2: 'in twelve new provinces — the grid', line3: 'learning to breathe without burning.' },
  low: { line1: 'Another hospital closes its doors', line2: 'in the delta, where the river carries', line3: 'more medicine than the roads.' },
  buffalo: { line1: 'A man in Oslo trained his parrot', line2: 'to order groceries online — the bird', line3: 'now prefers organic seed.' },
};

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const eastern = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const h = eastern.getHours();
  const m = eastern.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

export default async function PoemPage() {
  // Priority: Art mode → News Poetry fallback
  const art = await getLatestArt();
  if (art?.mode === 'art' && art.imageUrl) {
    return <ArtView art={art} />;
  }

  const news = await getLatestPoem();
  return <NewsView data={news || FALLBACK} />;
}

// ─── Art View: Full-bleed charcoal + black bar with HLB text ───

function ArtView({ art }) {
  // Build the text line from H/L/B
  const entries = [];
  if (art.high) entries.push({ label: 'H', text: art.high });
  if (art.low) entries.push({ label: 'L', text: art.low });
  if (art.buffalo) entries.push({ label: 'B', text: art.buffalo });

  return (
    <div style={{
      width: '1404px',
      height: '1872px',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* Art — full bleed, fills everything above text bar */}
      <div style={{
        flex: '1',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.imageUrl}
          alt="Family art"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(1.15)',
          }}
        />
      </div>

      {/* Black bar at bottom — HLB text + attribution */}
      <div style={{
        flexShrink: 0,
        backgroundColor: '#000000',
        padding: '36px 60px 44px 60px',
        borderTop: '3px solid #ffffff',
      }}>
        {/* H/L/B entries */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '20px',
        }}>
          {entries.map((entry) => (
            <div key={entry.label} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '20px',
            }}>
              <span style={{
                fontSize: '30px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: '700',
                letterSpacing: '0.3em',
                color: '#ffffff',
                minWidth: '50px',
              }}>
                {entry.label}
              </span>
              <span style={{
                fontSize: '38px',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: '700',
                fontStyle: entry.label === 'B' ? 'italic' : 'normal',
                color: '#ffffff',
                lineHeight: '1.3',
              }}>
                {entry.text}
              </span>
            </div>
          ))}
        </div>

        {/* Attribution */}
        <div style={{
          fontSize: '26px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'right',
        }}>
          — {art.from} · {formatTime(art.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ─── News View: AI-generated poems from headlines (fallback) ───

function NewsView({ data }) {
  const high = data.high || FALLBACK.high;
  const low = data.low || FALLBACK.low;
  const buffalo = data.buffalo || FALLBACK.buffalo;

  return (
    <div style={{
      width: '1404px',
      height: '1872px',
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: 'Georgia, "Times New Roman", serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '80px 90px',
      boxSizing: 'border-box',
    }}>
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '32px', fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '700', letterSpacing: '0.5em', color: '#ffffff', marginBottom: '28px' }}>HIGH</div>
        <div style={{ fontSize: '62px', fontWeight: '700', lineHeight: '1.5', color: '#ffffff' }}>{high.line1}<br />{high.line2}<br />{high.line3}</div>
      </div>
      <div style={{ width: '100%', height: '2px', backgroundColor: '#ffffff', margin: '10px 0' }} />
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '32px', fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '700', letterSpacing: '0.5em', color: '#ffffff', marginBottom: '28px' }}>LOW</div>
        <div style={{ fontSize: '62px', fontWeight: '700', lineHeight: '1.5', color: '#ffffff' }}>{low.line1}<br />{low.line2}<br />{low.line3}</div>
      </div>
      <div style={{ width: '100%', height: '2px', backgroundColor: '#ffffff', margin: '10px 0' }} />
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '32px', fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '700', letterSpacing: '0.5em', color: '#ffffff', marginBottom: '28px' }}>BUFFALO</div>
        <div style={{ fontSize: '62px', fontWeight: '700', fontStyle: 'italic', lineHeight: '1.5', color: '#ffffff' }}>{buffalo.line1}<br />{buffalo.line2}<br />{buffalo.line3}</div>
      </div>
    </div>
  );
}
