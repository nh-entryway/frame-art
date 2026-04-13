export default function PoemPage() {
  const now = new Date();
  const hour = now.getHours();
  const timeLabel = hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

  return (
    <div style={{
      width: '1404px',
      height: '1872px',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'Georgia, "Times New Roman", serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '120px 140px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Ghost poem - previous hour */}
      <div style={{
        position: 'absolute',
        top: '180px',
        left: '160px',
        right: '160px',
        color: '#c0c0c0',
        fontSize: '42px',
        lineHeight: '1.6',
        fontStyle: 'italic',
        fontWeight: '300',
      }}>
        <p style={{ margin: 0 }}>The three o'clock sun pressed</p>
        <p style={{ margin: 0 }}>its thumb against the window,</p>
        <p style={{ margin: 0 }}>leaving fingerprints of trade routes</p>
        <p style={{ margin: 0 }}>and someone's lost referendum.</p>
      </div>

      {/* Scattered headline fragments */}
      {[
        { text: 'ceasefire collapses', top: '100px', left: '80px', rotate: '-8deg', opacity: 0.15 },
        { text: 'glacier retreats', top: '60px', right: '120px', rotate: '5deg', opacity: 0.12 },
        { text: 'senate convenes', bottom: '340px', left: '60px', rotate: '-4deg', opacity: 0.14 },
        { text: 'markets surge', top: '520px', right: '80px', rotate: '7deg', opacity: 0.1 },
        { text: 'rainfall exceeds', bottom: '200px', right: '100px', rotate: '-6deg', opacity: 0.13 },
        { text: 'border reopens', bottom: '500px', left: '100px', rotate: '3deg', opacity: 0.11 },
        { text: 'summit delayed', top: '900px', right: '60px', rotate: '-5deg', opacity: 0.12 },
      ].map((frag, i) => (
        <span key={i} style={{
          position: 'absolute',
          fontSize: '18px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          color: '#000',
          opacity: frag.opacity,
          transform: `rotate(${frag.rotate})`,
          top: frag.top,
          left: frag.left,
          right: frag.right,
          bottom: frag.bottom,
          letterSpacing: '0.05em',
        }}>
          {frag.text}
        </span>
      ))}

      {/* Current poem - main content */}
      <div style={{
        marginTop: '280px',
        fontSize: '52px',
        lineHeight: '1.7',
        fontWeight: '700',
        color: '#0a0a0a',
        textAlign: 'left',
        maxWidth: '1100px',
      }}>
        <p style={{ margin: '0 0 8px 0' }}>The afternoon bends its light</p>
        <p style={{ margin: '0 0 8px 0' }}>through corridors of ceased fire,</p>
        <p style={{ margin: '0 0 8px 0' }}>glaciers retreating from headlines</p>
        <p style={{ margin: '0 0 8px 0' }}>we forgot to finish reading.</p>
        <p style={{ margin: '28px 0 8px 0' }}>Markets open like mouths—</p>
        <p style={{ margin: '0 0 8px 0' }}>what spills out is not language</p>
        <p style={{ margin: '0 0 8px 0' }}>but the sound of four o'clock</p>
        <p style={{ margin: '0 0 0 0' }}>settling into its own shadow.</p>
      </div>

      {/* Time and date footer */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '0',
        right: '0',
        textAlign: 'center',
        fontSize: '22px',
        letterSpacing: '0.3em',
        color: '#999',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontWeight: '300',
      }}>
        {romanNumerals[hour]} · {dayNames[now.getDay()]} · {now.getDate()} {monthNames[now.getMonth()]}
      </div>
    </div>
  );
}
