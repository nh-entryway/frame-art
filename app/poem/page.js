import { getLatestPoem } from '../../lib/storage.js';

export const dynamic = 'force-dynamic';

// Fallback poems when no data in Blob yet
const FALLBACK = {
  high: { line1: 'Solar farms now outpace coal', line2: 'in twelve new provinces — the grid', line3: 'learning to breathe without burning.' },
  low: { line1: 'Another hospital closes its doors', line2: 'in the delta, where the river carries', line3: 'more medicine than the roads.' },
  buffalo: { line1: 'A man in Oslo trained his parrot', line2: 'to order groceries online — the bird', line3: 'now prefers organic seed.' },
};

export default async function PoemPage() {
  const data = await getLatestPoem() || FALLBACK;

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
          {high.line1}<br />
          {high.line2}<br />
          {high.line3}
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
          {low.line1}<br />
          {low.line2}<br />
          {low.line3}
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
          {buffalo.line1}<br />
          {buffalo.line2}<br />
          {buffalo.line3}
        </div>
      </div>

    </div>
  );
}
