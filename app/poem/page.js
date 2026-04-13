export const dynamic = 'force-dynamic';

export default function PoemPage() {
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

      {/* HIGH */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontSize: '32px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '700',
          letterSpacing: '0.5em',
          color: '#ffffff',
          marginBottom: '28px',
        }}>
          HIGH
        </div>
        <div style={{
          fontSize: '62px',
          fontWeight: '700',
          lineHeight: '1.5',
          color: '#ffffff',
        }}>
          Solar farms now outpace coal<br />
          in twelve new provinces — the grid<br />
          learning to breathe without burning.
        </div>
      </div>

      {/* Rule */}
      <div style={{ width: '100%', height: '2px', backgroundColor: '#ffffff', margin: '10px 0' }} />

      {/* LOW */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontSize: '32px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '700',
          letterSpacing: '0.5em',
          color: '#ffffff',
          marginBottom: '28px',
        }}>
          LOW
        </div>
        <div style={{
          fontSize: '62px',
          fontWeight: '700',
          lineHeight: '1.5',
          color: '#ffffff',
        }}>
          Another hospital closes its doors<br />
          in the delta, where the river carries<br />
          more medicine than the roads.
        </div>
      </div>

      {/* Rule */}
      <div style={{ width: '100%', height: '2px', backgroundColor: '#ffffff', margin: '10px 0' }} />

      {/* BUFFALO */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontSize: '32px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: '700',
          letterSpacing: '0.5em',
          color: '#ffffff',
          marginBottom: '28px',
        }}>
          BUFFALO
        </div>
        <div style={{
          fontSize: '62px',
          fontWeight: '700',
          fontStyle: 'italic',
          lineHeight: '1.5',
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
