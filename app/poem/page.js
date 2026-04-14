import { getLatestArt } from '../../lib/storage.js';

export const dynamic = 'force-dynamic';

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
  const art = await getLatestArt();

  if (art?.mode === 'art' && art.imageUrl) {
    if (art.source === 'zeitgeist') {
      return <ZeitgeistView art={art} />;
    }
    return <SmsView art={art} />;
  }

  return <FallbackView />;
}

// ─── Zeitgeist View: Truism first, image responds ───

function ZeitgeistView({ art }) {
  const headlineWithSource = [art.headline, art.source].filter(Boolean).join(' — ');

  return (
    <div style={{
      width: '1404px',
      height: '1872px',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Woodcut — fills available space above the text */}
      <div style={{
        flex: '1',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${art.imageUrl}?t=${Date.now()}`}
          alt="Zeitgeist woodcut"
          style={{
            position: 'absolute',
            top: '-1%',
            left: '-1%',
            width: '102%',
            height: '102%',
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(1.3)',
          }}
        />
      </div>

      {/* Text bar — solid black, anchored at bottom like a gallery placard */}
      <div style={{
        flexShrink: 0,
        backgroundColor: '#000000',
        padding: '40px 56px 48px 56px',
      }}>
        {/* Holzer truism — big, tight, aggressive */}
        {art.truism && (
          <div style={{
            fontSize: '64px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            color: '#ffffff',
            textTransform: 'uppercase',
            lineHeight: '1.05',
            marginBottom: '24px',
          }}>
            {art.truism}
          </div>
        )}

        {/* Headline — white, smaller, lighter weight for hierarchy */}
        {art.headline && (
          <div style={{
            fontSize: '22px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '400',
            letterSpacing: '0.18em',
            color: '#ffffff',
            textTransform: 'uppercase',
          }}>
            {art.headline}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── SMS View: Woodcut + User Caption ───

function SmsView({ art }) {
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

      {/* Woodcut — full bleed, over-scaled to crop Flux border artifacts */}
      <div style={{
        flex: '1',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${art.imageUrl}?t=${Date.now()}`}
          alt="User woodcut"
          style={{
            position: 'absolute',
            top: '-3%',
            left: '-3%',
            width: '106%',
            height: '106%',
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(1.6)',
          }}
        />
      </div>

      {/* Caption bar */}
      <div style={{
        flexShrink: 0,
        backgroundColor: '#000000',
        padding: '32px 60px 36px 60px',
      }}>
        {/* Caption text */}
        <div style={{
          fontSize: '56px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '800',
          letterSpacing: '0.02em',
          color: '#ffffff',
          textTransform: 'uppercase',
          lineHeight: '1.15',
          marginBottom: '16px',
        }}>
          {art.caption || art.prompt}
        </div>

        {/* Attribution */}
        <div style={{
          fontSize: '24px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '400',
          color: '#777777',
          textAlign: 'right',
          letterSpacing: '0.08em',
        }}>
          {art.from} · {formatTime(art.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ─── Fallback: Static message when no art exists ───

function FallbackView() {
  return (
    <div style={{
      width: '1404px',
      height: '1872px',
      backgroundColor: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      fontFamily: 'Helvetica, Arial, sans-serif',
    }}>
      <div style={{
        fontSize: '48px',
        fontWeight: '700',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        textAlign: 'center',
        lineHeight: '1.4',
        padding: '0 120px',
      }}>
        THE FRAME IS LISTENING
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: '400',
        letterSpacing: '0.08em',
        marginTop: '40px',
        color: '#999999',
      }}>
        WAITING FOR THE WORLD
      </div>
    </div>
  );
}
