export default function MockupPage() {
  return (
    <div style={{
      width: '1404px',
      height: '1872px',
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: 'Georgia, "Times New Roman", serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* Woodcut Art — top 60% */}
      <div style={{
        flex: '0 0 1100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 70px 30px 70px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          border: '3px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          color: '#666',
          fontStyle: 'italic',
        }}>
          {/* In production this would be an <img> from Blob */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="https://i.imgur.com/placeholder.png" 
            alt="AI Generated Woodcut"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              filter: 'grayscale(1) contrast(1.4)',
            }} 
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: '0 70px', height: '3px', backgroundColor: '#fff' }} />

      {/* Text submissions — bottom 40% */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '30px 80px 60px 80px',
        gap: '36px',
      }}>

        {/* HIGH */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px' }}>
          <div style={{
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '700',
            letterSpacing: '0.4em',
            flexShrink: 0,
            minWidth: '200px',
          }}>
            HIGH
          </div>
          <div style={{ fontSize: '48px', fontWeight: '700', lineHeight: '1.3', flex: 1 }}>
            making this art
          </div>
          <div style={{
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '700',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            — Noah
          </div>
        </div>

        {/* LOW */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px' }}>
          <div style={{
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '700',
            letterSpacing: '0.4em',
            flexShrink: 0,
            minWidth: '200px',
          }}>
            LOW
          </div>
          <div style={{ fontSize: '48px', fontWeight: '700', lineHeight: '1.3', flex: 1 }}>
            sad people
          </div>
          <div style={{
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '700',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            — Mom
          </div>
        </div>

        {/* BUFFALO */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px' }}>
          <div style={{
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '700',
            letterSpacing: '0.4em',
            flexShrink: 0,
            minWidth: '200px',
          }}>
            BUFFALO
          </div>
          <div style={{ fontSize: '48px', fontWeight: '700', fontStyle: 'italic', lineHeight: '1.3', flex: 1 }}>
            tennis
          </div>
          <div style={{
            fontSize: '28px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: '700',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            — Isaac
          </div>
        </div>

        {/* Timestamp */}
        <div style={{
          fontSize: '24px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '700',
          textAlign: 'right',
          color: '#fff',
          marginTop: '10px',
        }}>
          April 13, 2026 · 8:43 PM
        </div>
      </div>
    </div>
  );
}
