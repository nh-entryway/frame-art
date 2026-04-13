export const dynamic = 'force-dynamic';

export default function PoemPage() {
  return (
    <div style={{
      width: '1404px',
      height: '1872px',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'Georgia, "Times New Roman", serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '100px 100px',
      boxSizing: 'border-box',
    }}>

      {/* HIGH */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontSize: '22px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '400',
          letterSpacing: '0.5em',
          color: '#666666',
          marginBottom: '32px',
        }}>
          HIGH
        </div>
        <div style={{
          fontSize: '64px',
          fontWeight: '400',
          lineHeight: '1.45',
          color: '#ffffff',
        }}>
          Solar farms now outpace coal<br />
          in twelve new provinces — the grid<br />
          learning to breathe without burning.
        </div>
      </div>

      {/* Rule */}
      <div style={{
        width: '100%',
        height: '1px',
        backgroundColor: '#333333',
        margin: '20px 0',
      }} />

      {/* LOW */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontSize: '22px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '400',
          letterSpacing: '0.5em',
          color: '#666666',
          marginBottom: '32px',
        }}>
          LOW
        </div>
        <div style={{
          fontSize: '64px',
          fontWeight: '400',
          lineHeight: '1.45',
          color: '#ffffff',
        }}>
          Another hospital closes its doors<br />
          in the delta, where the river carries<br />
          more medicine than the roads.
        </div>
      </div>

      {/* Rule */}
      <div style={{
        width: '100%',
        height: '1px',
        backgroundColor: '#333333',
        margin: '20px 0',
      }} />

      {/* BUFFALO */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontSize: '22px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '400',
          letterSpacing: '0.5em',
          color: '#666666',
          marginBottom: '32px',
        }}>
          BUFFALO
        </div>
        <div style={{
          fontSize: '64px',
          fontWeight: '400',
          fontStyle: 'italic',
          lineHeight: '1.45',
          color: '#ffffff',
        }}>
          A man in Oslo trained his parrot<br />
          to order groceries online — the bird<br />
          now prefers organic seed.
        </div>
      </div>

    </div>
  );
}
