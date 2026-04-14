import { getLatestPoem, getLatestFamilySubmissions, getLatestArt } from '../../lib/storage.js';

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

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function PoemPage() {
  // Priority: Art → Family HLB → News Poetry
  const art = await getLatestArt();
  if (art?.mode === 'art' && art.imageUrl) {
    return <ArtView art={art} />;
  }

  const family = await getLatestFamilySubmissions();
  const hasFamily = family?.mode === 'family' && (family.high || family.low || family.buffalo);
  if (hasFamily) {
    return <FamilyView family={family} />;
  }

  const news = await getLatestPoem();
  return <NewsView data={news || FALLBACK} />;
}

// ─── Art View: Full-bleed charcoal art + museum plaque ───

function ArtView({ art }) {
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

      {/* Art — fills most of the frame */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 60px 20px 60px',
        boxSizing: 'border-box',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art.imageUrl}
          alt={art.text}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            filter: 'grayscale(1) contrast(1.2)',
          }}
        />
      </div>

      {/* Divider */}
      <div style={{ margin: '0 70px', height: '3px', backgroundColor: '#ffffff' }} />

      {/* Museum plaque */}
      <div style={{
        padding: '30px 80px 60px 80px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontSize: '44px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: '700',
          fontStyle: 'italic',
          lineHeight: '1.4',
          color: '#ffffff',
          marginBottom: '20px',
        }}>
          &ldquo;{art.text}&rdquo;
        </div>
        <div style={{
          fontSize: '32px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'right',
        }}>
          — {art.from} · {formatDate(art.timestamp)} · {formatTime(art.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ─── Family View: HLB text submissions ───

function FamilyView({ family }) {
  const sections = ['high', 'low', 'buffalo'];

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
      {sections.map((cat, i) => {
        const item = family[cat];
        if (!item) return null;
        const isBuffalo = cat === 'buffalo';

        return (
          <div key={cat}>
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: '700',
                letterSpacing: '0.5em',
                color: '#ffffff',
                marginBottom: '28px',
              }}>
                {cat.toUpperCase()}
              </div>
              <div style={{
                fontSize: '58px',
                fontWeight: '700',
                fontStyle: isBuffalo ? 'italic' : 'normal',
                lineHeight: '1.5',
                color: '#ffffff',
              }}>
                {item.text}
              </div>
              <div style={{
                fontSize: '36px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontWeight: '700',
                color: '#ffffff',
                marginTop: '28px',
                textAlign: 'right',
                letterSpacing: '0.05em',
              }}>
                — {item.from} · {formatTime(item.timestamp)}
              </div>
            </div>
            {i < 2 && (
              <div style={{ width: '100%', height: '2px', backgroundColor: '#ffffff', margin: '10px 0' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── News View: AI-generated poems from headlines ───

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
