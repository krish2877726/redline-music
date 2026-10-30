import React, { useState, useEffect } from 'react';
import { Icon } from '../components/SvgIcons.jsx';
import { fmt } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';
import { TrackListSkeleton, ShelfSkeleton } from '../components/SkeletonLoaders.jsx';
import { TrackOptionsMenu } from '../components/TrackOptionsMenu.jsx';
import { SaveToPlaylistModal } from '../components/SaveToPlaylistModal.jsx';

const BROWSE_CATEGORIES = [
  { name: 'Pop', color: '#8d67ab' },
  { name: 'Hip-Hop', color: '#ba5d07' },
  { name: 'Rock', color: '#e91429' },
  { name: 'Dance & Electronic', color: '#006450' },
  { name: 'Indie & Alternative', color: '#e1118c' },
  { name: 'R&B & Soul', color: '#8c1932' },
  { name: 'Lo-Fi & Chill', color: '#477d95' },
  { name: 'Acoustic & Folk', color: '#777777' },
  { name: 'Bollywood & Desi', color: '#ff4632' },
  { name: 'Latin', color: '#e13300' },
  { name: 'Jazz & Blues', color: '#1e3264' },
  { name: 'Workout & Fitness', color: '#7d4b32' },
];

export function SearchView({ query, onSelectQuery, onNavigate, onShowToast }) {
  const { playTrack, likedTracks, toggleLike } = usePlayer();
  const { settings } = useSettings();
  const [filter, setFilter] = useState('');
  const [results, setResults] = useState({ songs: [], artists: [], albums: [], playlists: [] });
  const [loading, setLoading] = useState(false);
  const [optionsTrack, setOptionsTrack] = useState(null);
  const [saveModalTrack, setSaveModalTrack] = useState(null);
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const h = localStorage.getItem('redline_search_history');
      return h ? JSON.parse(h) : [];
    } catch (_) {
      return [];
    }
  });

  // Execute full search ONLY when submitted query or active filter changes
  useEffect(() => {
    if (!query || !query.trim()) {
      setResults({ songs: [], artists: [], albums: [], playlists: [] });
      setLoading(false);
      return;
    }

    const qClean = query.trim();

    // Save to history
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== qClean.toLowerCase());
      const updated = [qClean, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('redline_search_history', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    setLoading(true);
    let isCancelled = false;

    fetch(`/api/search?q=${encodeURIComponent(qClean)}&type=${filter || 'all'}`)
      .then(res => {
        if (!res.ok) throw new Error('Search network error');
        return res.json();
      })
      .then(data => {
        if (!isCancelled) {
          setResults(data || { songs: [], artists: [], albums: [], playlists: [] });
        }
      })
      .catch(err => {
        console.warn('[SearchView] Search error:', err);
        if (!isCancelled) {
          onShowToast('Could not load search results');
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [query, filter]);

  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('redline_search_history');
    } catch (_) {}
  };

  const removeHistoryItem = (itemToRemove, e) => {
    e.stopPropagation();
    setSearchHistory(prev => {
      const updated = prev.filter(x => x !== itemToRemove);
      try {
        localStorage.setItem('redline_search_history', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Browse view when no query is submitted
  if (!query || !query.trim()) {
    return (
      <div className="search-view">
        <div className="hdr-glow" />

        {/* Recent Searches (Snitify UX) */}
        {searchHistory.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="sec-title" style={{ margin: 0 }}>Recent searches</h2>
              <button
                className="btn btn-outline"
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={clearHistory}
              >
                Clear all
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {searchHistory.map((item, idx) => (
                <button
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    background: 'var(--surface-2)',
                    borderRadius: '24px',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onClick={() => onSelectQuery(item)}
                >
                  <Icon name="search" className="i-16" style={{ opacity: 0.7 }} />
                  <span>{item}</span>
                  <span
                    style={{ marginLeft: '4px', opacity: 0.5, cursor: 'pointer' }}
                    onClick={e => removeHistoryItem(item, e)}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <h2 className="page-title">Browse all</h2>
        <div className="browse">
          {BROWSE_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              className="genre"
              style={{
                '--c': cat.color,
                '--i': i,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '8px',
                padding: '16px',
                minHeight: '140px',
                textAlign: 'left',
              }}
              onClick={() => onSelectQuery(cat.name)}
            >
              <span style={{ fontSize: '20px', fontWeight: 800 }}>{cat.name}</span>
              <div
                style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '-10px',
                  width: '80px',
                  height: '80px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.12)',
                  transform: 'rotate(25deg)',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const hasAnyResults =
    (results.songs && results.songs.length > 0) ||
    (results.artists && results.artists.length > 0) ||
    (results.albums && results.albums.length > 0) ||
    (results.playlists && results.playlists.length > 0);

  if (loading) {
    return (
      <div className="search-results-page" style={{ paddingTop: '24px' }}>
        <div className="hdr-glow" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--muted)' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Searching YouTube Music for “{query}”...</span>
        </div>
        <div style={{ marginBottom: '32px' }}>
          <TrackListSkeleton count={5} />
        </div>
        <div style={{ marginBottom: '32px' }}>
          <ShelfSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (!hasAnyResults) {
    return (
      <div className="empty" style={{ paddingTop: '80px' }}>
        <Icon name="search" />
        <h2>No results found for “{query}”</h2>
        <p>Check the spelling, or try searching for an artist, song title, or genre.</p>
      </div>
    );
  }

  const topSong = results.songs?.[0];
  const topArtist = results.artists?.[0];
  const topResult = topArtist
    ? {
        type: 'Artist',
        title: topArtist.name,
        sub: 'Artist',
        img: getOptimizedThumbnail(topArtist.thumbnail, settings),
        round: true,
        action: () => onNavigate('artist', topArtist.id),
      }
    : topSong
    ? {
        type: 'Song',
        title: topSong.title,
        sub: topSong.artist,
        img: getOptimizedThumbnail(topSong.thumbnail, settings),
        round: false,
        action: () => playTrack(topSong, 'search'),
      }
    : null;

  return (
    <div className="search-results-page">
      <div className="hdr-glow" />

      {/* Filter Pills */}
      <div className="pills sres-pills">
        {[
          ['', 'All'],
          ['songs', 'Songs'],
          ['artists', 'Artists'],
          ['albums', 'Albums'],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`pill ${filter === k ? 'on' : ''}`}
            onClick={() => setFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top Result & Songs */}
      {(!filter || filter === 'songs') && (
        <div className="results" style={filter === 'songs' ? { gridTemplateColumns: '1fr' } : {}}>
          {!filter && topResult && (
            <div>
              <h2 className="sec-title">Top result</h2>
              <div
                className="top-result"
                onClick={topResult.action}
              >
                <img
                  className={topResult.round ? 'round' : ''}
                  src={topResult.img}
                  alt=""
                />
                <h3>{topResult.title}</h3>
                <p>
                  <span className="tag">{topResult.type}</span>
                  {topResult.sub}
                </p>
                <button
                  className="play-btn pp"
                  aria-label="Play top result"
                  onClick={e => {
                    e.stopPropagation();
                    topResult.action();
                  }}
                >
                  <Icon name="play" className="ic-play" />
                </button>
              </div>
            </div>
          )}

          {results.songs && results.songs.length > 0 && (
            <div>
              <h2 className="sec-title">Songs</h2>
              <div className="tl c3">
                {results.songs.slice(0, 30).map((song, i) => {
                  const isLiked = likedTracks.has(song.id);
                  const thumb = getOptimizedThumbnail(song.thumbnail, settings);
                  const trackList = results.songs.slice(0, 30);
                  return (
                    <div
                      key={song.id}
                      className="tr"
                      style={{ '--i': i }}
                      onClick={() => playTrack(song, 'search', i, trackList)}
                    >
                      <div className="tr-main">
                        <img src={thumb} alt="" loading="lazy" />
                        <div className="tr-text">
                          <div className="tr-title">{song.title}</div>
                          <div className="tr-artist">
                            {song.explicit && <span className="explicit">E</span>}
                            <span>{song.artist}</span>
                          </div>
                        </div>
                      </div>

                      <div className="tr-end">
                        <button
                          className={`tr-like ${isLiked ? 'on' : ''}`}
                          aria-label="Like song"
                          onClick={e => {
                            e.stopPropagation();
                            toggleLike(song.id);
                            onShowToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
                          }}
                        >
                          <Icon name="heart" className="i-16" />
                          <Icon name="heart-fill" className="i-16" />
                        </button>
                        <span className="tr-dur">{song.durationText || fmt(song.duration)}</span>
                        <button
                          className="tr-more"
                          title="More options"
                          onClick={e => {
                            e.stopPropagation();
                            setOptionsTrack(song);
                          }}
                        >
                          <Icon name="more" className="i-16" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Artists Shelf */}
      {(!filter || filter === 'artists') && results.artists && results.artists.length > 0 && (
        <section className="shelf">
          <div className="shelf-head">
            <h2 className="shelf-title">Artists</h2>
          </div>
          <div className="track">
            {results.artists.map((ar, i) => {
              const thumb = getOptimizedThumbnail(ar.thumbnail, settings);
              return (
                <div
                  key={ar.id}
                  className="card round"
                  style={{ '--i': i }}
                  onClick={() => onNavigate('artist', ar.id)}
                >
                  <div className="card-media">
                    <div className="card-art">
                      <img src={thumb} alt="" loading="lazy" />
                    </div>
                  </div>
                  <span className="card-title">{ar.name}</span>
                  <div className="card-sub">{ar.subscribers || 'Artist'}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Albums Shelf */}
      {(!filter || filter === 'albums') && results.albums && results.albums.length > 0 && (
        <section className="shelf">
          <div className="shelf-head">
            <h2 className="shelf-title">Albums</h2>
          </div>
          <div className="track">
            {results.albums.map((alb, i) => {
              const thumb = getOptimizedThumbnail(alb.thumbnail, settings);
              return (
                <div
                  key={alb.id}
                  className="card"
                  style={{ '--i': i }}
                  onClick={() => onNavigate('album', alb.id)}
                >
                  <div className="card-media">
                    <div className="card-art">
                      <img src={thumb} alt="" loading="lazy" />
                    </div>
                  </div>
                  <span className="card-title">{alb.title}</span>
                  <div className="card-sub">
                    {alb.year ? `${alb.year} • ` : ''}
                    {alb.artist}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Universal Track Options Menu */}
      <TrackOptionsMenu
        track={optionsTrack}
        isOpen={!!optionsTrack}
        onClose={() => setOptionsTrack(null)}
        onOpenSaveToPlaylist={t => setSaveModalTrack(t)}
        onNavigate={onNavigate}
        onShowToast={onShowToast}
      />

      {/* Save to Playlist Modal */}
      <SaveToPlaylistModal
        track={saveModalTrack}
        isOpen={!!saveModalTrack}
        onClose={() => setSaveModalTrack(null)}
        onShowToast={onShowToast}
      />
    </div>
  );
}
