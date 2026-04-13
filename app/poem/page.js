export const dynamic = 'force-dynamic';

export default function PoemPage() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');

  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

  const styles = {
    canvas: {
      width: '1404px',
      height: '1872px',
      backgroundColor: '#111111',
      color: '#ffffff',
      fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '100px 120px 80px 120px',
      boxSizing: 'border-box',
      position: 'relative',
    },
    timeBlock: {
      textAlign: 'center',
      marginBottom: '20px',
    },
    time: {
      fontSize: '160px',
      fontWeight: '200',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      letterSpacing: '-4px',
      lineHeight: '1',
      color: '#ffffff',
    },
    ampm: {
      fontSize: '48px',
      fontWeight: '200',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      letterSpacing: '2px',
      color: '#888888',
      marginLeft: '12px',
    },
    dateText: {
      fontSize: '20px',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '300',
      letterSpacing: '0.35em',
      color: '#666666',
      marginTop: '16px',
      textAlign: 'center',
    },
    rule: {
      width: '100%',
      height: '1px',
      backgroundColor: '#333333',
      margin: '40px 0 36px 0',
    },
    sectionLabel: {
      fontSize: '16px',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400',
      letterSpacing: '0.4em',
      color: '#555555',
      marginBottom: '24px',
      textTransform: 'uppercase',
    },
    poemText: {
      fontSize: '46px',
      fontWeight: '400',
      lineHeight: '1.55',
      color: '#f0f0f0',
      margin: '0 0 0 0',
    },
    poemTextItalic: {
      fontSize: '46px',
      fontWeight: '400',
      fontStyle: 'italic',
      lineHeight: '1.55',
      color: '#f0f0f0',
      margin: '0 0 0 0',
    },
    source: {
      fontSize: '14px',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '300',
      color: '#444444',
      marginTop: '16px',
      letterSpacing: '0.1em',
    },
    footer: {
      position: 'absolute',
      bottom: '60px',
      left: '120px',
      right: '120px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerText: {
      fontSize: '14px',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '300',
      letterSpacing: '0.2em',
      color: '#333333',
    },
  };

  return (
    <div style={styles.canvas}>
      {/* Time */}
      <div style={styles.timeBlock}>
        <span style={styles.time}>{displayHour}:{displayMinute}</span>
        <span style={styles.ampm}>{ampm}</span>
        <div style={styles.dateText}>
          {dayNames[now.getDay()]} · {now.getDate()} {monthNames[now.getMonth()]} · {now.getFullYear()}
        </div>
      </div>

      {/* Rule */}
      <div style={styles.rule} />

      {/* HIGH */}
      <div style={styles.sectionLabel}>HIGH</div>
      <div style={styles.poemText}>
        Solar farms now outpace coal<br />
        in twelve new provinces — the grid<br />
        learning to breathe without burning.
      </div>
      <div style={styles.source}>AP NEWS</div>

      {/* Rule */}
      <div style={styles.rule} />

      {/* LOW */}
      <div style={styles.sectionLabel}>LOW</div>
      <div style={styles.poemText}>
        Another hospital closes its doors<br />
        in the delta, where the river carries<br />
        more medicine than the roads.
      </div>
      <div style={styles.source}>NPR</div>

      {/* Rule */}
      <div style={styles.rule} />

      {/* BUFFALO */}
      <div style={styles.sectionLabel}>BUFFALO</div>
      <div style={styles.poemTextItalic}>
        A man in Oslo trained his parrot<br />
        to order groceries online — the bird<br />
        now prefers organic seed.
      </div>
      <div style={styles.source}>BBC</div>

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>HIGH LOW BUFFALO</span>
        <span style={styles.footerText}>AP · NPR · BBC</span>
      </div>
    </div>
  );
}
