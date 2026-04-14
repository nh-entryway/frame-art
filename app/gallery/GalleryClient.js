'use client';

import { useState } from 'react';

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

export default function GalleryClient({ items, settings: initialSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [lightbox, setLightbox] = useState(null);
  const [actionPending, setActionPending] = useState(null);

  async function handlePin(timestamp) {
    setActionPending(timestamp);
    try {
      const isPinned = settings.pinnedTimestamp === timestamp;
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: isPinned ? null : timestamp }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(s => ({ ...s, pinnedTimestamp: data.pinned }));
      }
    } catch (e) {
      console.error('Pin failed:', e);
    }
    setActionPending(null);
  }

  async function handleToggleGeneration() {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateEnabled: !settings.generateEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(s => ({ ...s, generateEnabled: data.generateEnabled }));
      }
    } catch (e) {
      console.error('Toggle failed:', e);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'Helvetica, Arial, sans-serif',
    }}>

      {/* Artist Statement */}
      <header style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '64px 24px 48px 24px',
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: '800',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          margin: '0 0 32px 0',
          lineHeight: '1.05',
        }}>
          The Owl
        </h1>
        <div style={{
          fontSize: '15px',
          lineHeight: '1.7',
          color: '#bbbbbb',
          maxWidth: '600px',
        }}>
          <p style={{ margin: '0 0 16px 0' }}>
            Every hour, a system reads the news. It finds the headline that
            carries the most weight and distills it into a single declaration:
            a truism in the tradition of Jenny Holzer. Then it transforms the owl.
          </p>
          <p style={{ margin: '0 0 16px 0' }}>
            The great horned owl is the editorial character. Carved in the style of
            a woodcut relief print, it watches the viewer with a fixed, unblinking gaze.
            Each hour, the owl is adorned, burdened, or altered to reflect what the
            world has done. Chains for captivity. A muzzle for silence. Money in its
            talons for greed. The owl does not comment. It embodies.
          </p>
          <p style={{ margin: '0 0 16px 0' }}>
            The owl is totemic because it sees in the dark. In nearly every culture,
            it represents wisdom that arrives uninvited. It is the watcher at the
            threshold, the one who knows what you would prefer not to see. That is
            what editorial art should do.
          </p>
          <p style={{ margin: 0, color: '#888888', fontSize: '13px' }}>
            AI woodcut system. Claude writes the truism. FLUX.2 transforms the owl.
            Displayed on a 1404 x 1872 ePaper frame in 16 levels of gray.
            You can also text the owl at +1 (475) 471-0181.
          </p>
        </div>
      </header>

      {/* Controls */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 32px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{
          fontSize: '13px',
          color: '#555555',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {items.length} generation{items.length !== 1 ? 's' : ''}
          {settings.pinnedTimestamp && ' · 1 pinned'}
        </div>

        <button
          onClick={handleToggleGeneration}
          style={{
            background: 'none',
            border: '1px solid #333333',
            color: settings.generateEnabled ? '#ffffff' : '#ff6b6b',
            padding: '8px 16px',
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'Helvetica, Arial, sans-serif',
          }}
        >
          {settings.generateEnabled ? 'Auto-generating hourly' : 'Generation paused'}
        </button>
      </div>

      {/* Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 64px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
        gap: '24px',
      }}>
        {items.map((item, i) => {
          const isZeitgeist = item.source === 'zeitgeist';
          const displayText = isZeitgeist ? item.truism : (item.caption || item.prompt);
          const displayImage = item.archiveUrl || item.imageUrl;
          const isPinned = settings.pinnedTimestamp === item.timestamp;
          const isPending = actionPending === item.timestamp;

          return (
            <div key={item.timestamp || i} style={{
              backgroundColor: '#111111',
              overflow: 'hidden',
              border: isPinned ? '2px solid #ffffff' : '1px solid #1a1a1a',
              position: 'relative',
            }}>
              {/* Pinned indicator */}
              {isPinned && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  padding: '4px 10px',
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  zIndex: 2,
                }}>
                  On Frame
                </div>
              )}

              {/* Image — clickable for lightbox */}
              {displayImage && (
                <div
                  onClick={() => setLightbox({ image: displayImage, text: displayText })}
                  style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
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
                    }}
                  />
                </div>
              )}

              {/* Text */}
              <div style={{ padding: '16px 20px 12px 20px' }}>
                {displayText && (
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    letterSpacing: '0.01em',
                    textTransform: 'uppercase',
                    lineHeight: '1.25',
                    marginBottom: '8px',
                  }}>
                    {displayText}
                  </div>
                )}

                {isZeitgeist && item.headline && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '400',
                    letterSpacing: '0.12em',
                    color: '#666666',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}>
                    {item.headline}
                  </div>
                )}

                <div style={{
                  fontSize: '11px',
                  color: '#444444',
                  letterSpacing: '0.06em',
                  marginBottom: '12px',
                }}>
                  {isZeitgeist ? 'Zeitgeist' : `SMS from ${item.from || 'unknown'}`}
                  {' · '}
                  {formatDateTime(item.timestamp)}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handlePin(item.timestamp)}
                    disabled={isPending}
                    style={{
                      flex: 1,
                      background: isPinned ? '#ffffff' : 'none',
                      color: isPinned ? '#000000' : '#888888',
                      border: '1px solid #333333',
                      padding: '8px 0',
                      fontSize: '11px',
                      fontWeight: '600',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: isPending ? 'wait' : 'pointer',
                      fontFamily: 'Helvetica, Arial, sans-serif',
                    }}
                  >
                    {isPending ? '...' : isPinned ? 'Unpin' : 'Pin to Frame'}
                  </button>

                  {displayImage && (
                    <a
                      href={displayImage}
                      download={`owl-${item.timestamp || 'art'}.png`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        color: '#888888',
                        border: '1px solid #333333',
                        padding: '8px 0',
                        fontSize: '11px',
                        fontWeight: '600',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                      }}
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '120px 24px',
          color: '#555555',
          fontSize: '20px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          No art yet. The owl is waiting.
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'pointer',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.image}
            alt={lightbox.text || 'Owl art'}
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 120px)',
              objectFit: 'contain',
            }}
          />
          {lightbox.text && (
            <div style={{
              marginTop: '20px',
              fontSize: 'clamp(14px, 3vw, 20px)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              textAlign: 'center',
              maxWidth: '600px',
            }}>
              {lightbox.text}
            </div>
          )}
          <div style={{
            marginTop: '16px',
            fontSize: '12px',
            color: '#555555',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}
