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

// ─── Zeitgeist View: Woodcut + Headline + Holzer Truism ───

function ZeitgeistView({ art }) {
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

      {/* Woodcut — full bleed */}
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
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(1.4)',
          }}
        />
      </div>

      {/* Caption bar — Headline + Holzer truism */}
      <div style={{
        flexShrink: 0,
        backgroundColor: '#000000',
        padding: '36px 60px 40px 60px',
        borderTop: '4px solid #ffffff',
      }}>
        {/* Factual headline */}
        {art.headline && (
          <div style={{
            fontSize: '30px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '400',
            letterSpacing: '0.12em',
            color: '#ffffff',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}>
            {art.headline}
          </div>
        )}

        {/* Holzer truism */}
        {art.truism && (
          <div style={{
            fontSize: '44px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '700',
            letterSpacing: '0.06em',
            color: '#ffffff',
            textTransform: 'uppercase',
            lineHeight: '1.25',
            marginBottom: '18px',
          }}>
            {art.truism}
          </div>
        )}

        {/* Source + time */}
        <div style={{
          fontSize: '24px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '400',
          color: '#ffffff',
          textAlign: 'right',
          letterSpacing: '0.05em',
          opacity: 0.6,
        }}>
          {art.newsSource || 'AP'} · {formatTime(art.timestamp)}
        </div>
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

      {/* Woodcut — full bleed */}
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
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(1.4)',
          }}
        />
      </div>

      {/* Caption bar */}
      <div style={{
        flexShrink: 0,
        backgroundColor: '#000000',
        padding: '36px 60px 40px 60px',
        borderTop: '4px solid #ffffff',
      }}>
        {/* Caption text */}
        <div style={{
          fontSize: '44px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '700',
          letterSpacing: '0.06em',
          color: '#ffffff',
          textTransform: 'uppercase',
          lineHeight: '1.25',
          marginBottom: '18px',
        }}>
          {art.caption || art.prompt}
        </div>

        {/* Attribution */}
        <div style={{
          fontSize: '24px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '400',
          color: '#ffffff',
          textAlign: 'right',
          letterSpacing: '0.05em',
          opacity: 0.6,
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
        opacity: 0.5,
      }}>
        WAITING FOR THE WORLD
      </div>
    </div>
  );
}
