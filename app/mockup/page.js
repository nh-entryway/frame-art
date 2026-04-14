export default function MockupPage() {
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

      {/* Woodcut Art — full bleed, fills everything above caption bar */}
      <div style={{
        flex: '1',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mockup-woodcut.jpg"
          alt="Woodcut art"
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

      {/* Caption bar at bottom */}
      <div style={{
        flexShrink: 0,
        backgroundColor: '#000000',
        padding: '32px 60px 36px 60px',
        borderTop: '4px solid #ffffff',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '40px',
      }}>
        {/* Caption text */}
        <div style={{
          fontSize: '42px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: '700',
          fontStyle: 'italic',
          color: '#ffffff',
          lineHeight: '1.3',
          flex: 1,
        }}>
          The world holds its breath at the edge
        </div>

        {/* Attribution */}
        <div style={{
          fontSize: '28px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '700',
          color: '#ffffff',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          — AP · 8:00 AM
        </div>
      </div>
    </div>
  );
}
