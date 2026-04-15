'use client';

import { useState } from 'react';

export default function StudioPage() {
  const [headline, setHeadline] = useState('');
  const [generating, setGenerating] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [released, setReleased] = useState(false);

  async function handleGenerate() {
    if (!headline.trim()) return;
    setGenerating(true);
    setError(null);
    setPreview(null);
    setReleased(false);

    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: headline.trim() }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Generation failed');
      } else {
        setPreview(data);
      }
    } catch (e) {
      setError(e.message);
    }
    setGenerating(false);
  }

  async function handleRelease() {
    if (!preview) return;
    setReleasing(true);
    setError(null);

    try {
      const res = await fetch('/api/studio/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: preview.timestamp,
          archiveUrl: preview.archiveUrl,
          truism: preview.truism,
          headline: preview.headline,
          scene: preview.scene,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Release failed');
      } else {
        setReleased(true);
      }
    } catch (e) {
      setError(e.message);
    }
    setReleasing(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'Helvetica, Arial, sans-serif',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: '800',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          margin: '0 0 8px 0',
        }}>
          Studio
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#888888',
          margin: '0 0 40px 0',
          lineHeight: '1.5',
        }}>
          Enter a headline. The system generates a truism and transforms the owl.
          Preview it. Regenerate if needed. Release when ready.
        </p>

        {/* Input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#666666',
            marginBottom: '8px',
          }}>
            Headline or theme
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !generating && handleGenerate()}
            placeholder="e.g. Treasury chief endorses economic pain"
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '16px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              backgroundColor: '#111111',
              border: '1px solid #333333',
              color: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !headline.trim()}
          style={{
            width: '100%',
            padding: '14px 0',
            fontSize: '14px',
            fontWeight: '700',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            backgroundColor: generating ? '#222222' : '#ffffff',
            color: generating ? '#666666' : '#000000',
            border: 'none',
            cursor: generating ? 'wait' : 'pointer',
            fontFamily: 'Helvetica, Arial, sans-serif',
            marginBottom: '32px',
          }}
        >
          {generating ? 'Generating... (30-40s)' : preview ? 'Regenerate' : 'Generate'}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#1a0000',
            border: '1px solid #551111',
            color: '#ff6b6b',
            fontSize: '13px',
            marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div style={{
            border: '1px solid #222222',
            backgroundColor: '#111111',
            marginBottom: '24px',
          }}>
            {/* Preview image */}
            {preview.archiveUrl && (
              <div style={{
                width: '100%',
                aspectRatio: '3 / 4',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.archiveUrl}
                  alt="Preview"
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

            {/* Preview text */}
            <div style={{ padding: '24px' }}>
              <div style={{
                fontSize: '20px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.01em',
                lineHeight: '1.15',
                marginBottom: '16px',
              }}>
                {preview.truism}
              </div>

              <div style={{
                fontSize: '13px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#888888',
                marginBottom: '16px',
              }}>
                {preview.headline}
              </div>

              <div style={{
                fontSize: '12px',
                color: '#444444',
                lineHeight: '1.5',
              }}>
                <strong style={{ color: '#666666' }}>Prompt:</strong> {preview.scene}
              </div>
            </div>

            {/* Release button */}
            <div style={{ padding: '0 24px 24px 24px' }}>
              {released ? (
                <div style={{
                  width: '100%',
                  padding: '14px 0',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  backgroundColor: '#0a2a0a',
                  border: '1px solid #1a4a1a',
                  color: '#4ade80',
                  boxSizing: 'border-box',
                }}>
                  Released to frame
                </div>
              ) : (
                <button
                  onClick={handleRelease}
                  disabled={releasing}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    fontSize: '14px',
                    fontWeight: '700',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    backgroundColor: releasing ? '#222222' : '#ffffff',
                    color: releasing ? '#666666' : '#000000',
                    border: 'none',
                    cursor: releasing ? 'wait' : 'pointer',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                  }}
                >
                  {releasing ? 'Releasing...' : 'Release to Frame'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Link to gallery */}
        <div style={{
          textAlign: 'center',
          paddingTop: '24px',
        }}>
          <a href="/gallery" style={{
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#555555',
            textDecoration: 'none',
          }}>
            View Gallery
          </a>
        </div>
      </div>
    </div>
  );
}
