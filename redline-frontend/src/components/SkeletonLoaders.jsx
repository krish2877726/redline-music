import React from 'react';

/**
 * Universal Spotify-grade Shimmer Skeletons for Redline
 */

export function TrackListSkeleton({ count = 6 }) {
  return (
    <div className="tl" style={{ opacity: 0.85 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="tr" style={{ cursor: 'default' }}>
          <div className="tr-main" style={{ gap: '14px' }}>
            <div className="shimmer-box" style={{ width: '48px', height: '48px', borderRadius: '4px', flexShrink: 0 }} />
            <div className="tr-text" style={{ flex: 1, gap: '6px', display: 'flex', flexDirection: 'column' }}>
              <div className="shimmer-box" style={{ height: '14px', width: `${55 + (i % 4) * 12}%` }} />
              <div className="shimmer-box" style={{ height: '11px', width: `${35 + (i % 3) * 10}%`, opacity: 0.6 }} />
            </div>
          </div>
          <div className="tr-end">
            <div className="shimmer-box" style={{ width: '36px', height: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShortcutsGridSkeleton() {
  return (
    <div className="quick" style={{ opacity: 0.85 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="qp" style={{ cursor: 'default' }}>
          <div className="shimmer-box" style={{ width: '56px', height: '56px', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '0 12px' }}>
            <div className="shimmer-box" style={{ height: '14px', width: `${60 + (i % 3) * 15}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShelfSkeleton({ count = 5 }) {
  return (
    <div className="track" style={{ opacity: 0.85 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ cursor: 'default' }}>
          <div className="card-media">
            <div className="shimmer-box" style={{ width: '100%', aspectRatio: '1', borderRadius: '6px' }} />
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="shimmer-box" style={{ height: '14px', width: '80%' }} />
            <div className="shimmer-box" style={{ height: '11px', width: '50%', opacity: 0.6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArtistShelfSkeleton({ count = 6 }) {
  return (
    <div className="track" style={{ opacity: 0.85, overflowX: 'auto', paddingBottom: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card round" style={{ minWidth: '120px', maxWidth: '140px', cursor: 'default' }}>
          <div className="card-media">
            <div
              className="shimmer-box"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                margin: '0 auto',
              }}
            />
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div className="shimmer-box" style={{ height: '14px', width: '70%' }} />
            <div className="shimmer-box" style={{ height: '11px', width: '40%', opacity: 0.6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
