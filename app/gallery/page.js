import { getArchivedArt } from '../../lib/storage.js';

export const dynamic = 'force-dynamic';

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default async function GalleryPage() {
  const items = await getArchivedArt();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: 'Helvetica, Arial, sans-serif',
      padding: '40px 24px',
    }}>

      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 48px auto',
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          The Owl Archive
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#888888',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginTop: '12px',
        }}>
          {items.length} generation{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '32px',
      }}>
        {items.map((item, i) => (
          <GalleryCard key={item.timestamp || i} item={item} />
        ))}
      </div>

      {items.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '120px 0',
          color: '#555555',
          fontSize: '24px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          No art yet — the owl is waiting
        </div>
      )}
    </div>
  );
}

function GalleryCard({ item }) {
  const isZeitgeist = item.source === 'zeitgeist';
  const displayText = isZeitgeist ? item.truism : (item.caption || item.prompt);
  const displayImage = item.archiveUrl || item.imageUrl;

  return (
    <div style={{
      backgroundColor: '#111111',
      overflow: 'hidden',
      border: '1px solid #222222',
    }}>
      {/* Image */}
      {item.imageUrl && (
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 4',
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt={displayText || 'Owl art'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(1) contrast(1.3)',
            }}
          />
        </div>
      )}

      {/* Text */}
      <div style={{ padding: '20px 24px 24px 24px' }}>
        {/* Truism or caption */}
        {displayText && (
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            lineHeight: '1.2',
            marginBottom: '12px',
          }}>
            {displayText}
          </div>
        )}

        {/* Headline (zeitgeist only) */}
        {isZeitgeist && item.headline && (
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            letterSpacing: '0.14em',
            color: '#888888',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            {item.headline}
          </div>
        )}

        {/* Meta line */}
        <div style={{
          fontSize: '12px',
          color: '#555555',
          letterSpacing: '0.08em',
        }}>
          {isZeitgeist ? 'ZEITGEIST' : `SMS · ${item.from || 'UNKNOWN'}`}
          {' · '}
          {formatDateTime(item.timestamp)}
        </div>
      </div>
    </div>
  );
}
