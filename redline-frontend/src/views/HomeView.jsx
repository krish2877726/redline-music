import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/SvgIcons.jsx';
import { art } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';
import { GLOBAL_LANGUAGES, INITIAL_ARTIST_IMAGES_MAP } from '../data/languages.js';
import { ShortcutsGridSkeleton, ShelfSkeleton, ArtistShelfSkeleton } from '../components/SkeletonLoaders.jsx';
import { TrackOptionsMenu } from '../components/TrackOptionsMenu.jsx';
import { SaveToPlaylistModal } from '../components/SaveToPlaylistModal.jsx';

export function HomeView({ onNavigate, onSetHdr, onShowToast, onOpenOnboarding, onSelectQuery }) {
  const {
    currentTrack,
    isPlaying,
    likedTracks,
    recentTracks,
    playTrack,
    togglePlay,
  } = usePlayer();

  const { settings } = useSettings();

  const [activeFilter, setActiveFilter] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [exploreShelves, setExploreShelves] = useState([]);
  const [artistShelves, setArtistShelves] = useState([]);
  const [languageShelves, setLanguageShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Options Menu & Playlist Modal States
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState(null);
  const [trackForPlaylistModal, setTrackForPlaylistModal] = useState(null);

  // User Onboarding Preferences
  const [userLanguages, setUserLanguages] = useState(() => {
    try {
      const s = localStorage.getItem('redline_selected_languages');
      return s ? JSON.parse(s) : ['English', 'Hindi'];
    } catch (_) {
      return ['English', 'Hindi'];
    }
  });

  const [userArtists, setUserArtists] = useState(() => {
    try {
      const a = localStorage.getItem('redline_selected_artists');
      return a ? JSON.parse(a) : ['Arijit Singh', 'Taylor Swift', 'Coldplay'];
    } catch (_) {
      return ['Arijit Singh', 'Taylor Swift', 'Coldplay'];
    }
  });

  const [artistImages, setArtistImages] = useState(() => {
    try {
      const stored = localStorage.getItem('redline_artist_images');
      return stored ? { ...INITIAL_ARTIST_IMAGES_MAP, ...JSON.parse(stored) } : INITIAL_ARTIST_IMAGES_MAP;
    } catch (_) {
      return INITIAL_ARTIST_IMAGES_MAP;
    }
  });

  // Pre-load missing artist images from backend
  useEffect(() => {
    userArtists.forEach(name => {
      if (!artistImages[name]) {
        fetch(`/api/search?q=${encodeURIComponent(name)}&type=artists`)
          .then(r => r.json())
          .then(data => {
            const thumb = data.artists?.[0]?.thumbnail;
            if (thumb) {
              setArtistImages(prev => {
                const next = { ...prev, [name]: thumb };
                try {
                  localStorage.setItem('redline_artist_images', JSON.stringify(next));
                } catch (_) {}
                return next;
              });
            }
          })
          .catch(() => {});
      }
    });
  }, [userArtists]);

  const heroTimerRef = useRef(null);
  const isHoveredRef = useRef(false);

  // Fetch live YouTube Music data + Personalized Recommendations
  useEffect(() => {
    let isCancelled = false;

    // 1. Trending & Explore
    Promise.allSettled([
      fetch('/api/music/trending').then(r => r.json()),
      fetch('/api/music/explore').then(r => r.json()),
    ])
      .then(([trendRes, expRes]) => {
        if (isCancelled) return;
        if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value?.songs)) {
          setTrendingSongs(trendRes.value.songs);
        }
        if (expRes.status === 'fulfilled' && Array.isArray(expRes.value)) {
          setExploreShelves(expRes.value);
        }
      })
      .catch(err => {
        console.warn('[HomeView] Load error:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    // 2. Personalized Artist Shelf (e.g. for user's top artist)
    if (userArtists && userArtists.length > 0) {
      const topArtist = userArtists[0];
      fetch(`/api/search?q=${encodeURIComponent(topArtist)}&type=songs`)
        .then(r => r.json())
        .then(data => {
          if (!isCancelled && data.songs && data.songs.length > 0) {
            setArtistShelves([{ artist: topArtist, songs: data.songs.slice(0, 10) }]);
          }
        })
        .catch(() => {});
    }

    // 3. Personalized Language Shelf
    if (userLanguages && userLanguages.length > 0) {
      const topLang = userLanguages[0];
      fetch(`/api/search?q=${encodeURIComponent('Top ' + topLang + ' Songs')}&type=songs`)
        .then(r => r.json())
        .then(data => {
          if (!isCancelled && data.songs && data.songs.length > 0) {
            setLanguageShelves([{ language: topLang, songs: data.songs.slice(0, 10) }]);
          }
        })
        .catch(() => {});
    }

    return () => {
      isCancelled = true;
    };
  }, [userArtists.join(','), userLanguages.join(',')]);

  const heroTracks = trendingSongs.slice(0, 5);

  // Hero carousel loop
  useEffect(() => {
    if (heroTracks.length <= 1) return;
    const DUR = 7000;
    const interval = 50;
    let elapsed = 0;

    heroTimerRef.current = setInterval(() => {
      if (isHoveredRef.current) return;
      elapsed += interval;
      setHeroProgress(Math.min(1, elapsed / DUR));

      if (elapsed >= DUR) {
        elapsed = 0;
        setHeroIndex(prev => (prev + 1) % heroTracks.length);
      }
    }, interval);

    return () => clearInterval(heroTimerRef.current);
  }, [heroTracks.length]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Up late?';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick picks: User's liked songs + top trending tracks (Snitify 6-grid)
  const quickPicks = [
    {
      title: 'Liked Songs',
      sub: `${likedTracks.size} songs`,
      img: art.liked(),
      action: () => onNavigate('playlist', 'liked'),
    },
    ...trendingSongs.slice(0, 5).map(s => ({
      title: s.title,
      sub: s.artist,
      img: getOptimizedThumbnail(s.thumbnail, settings),
      action: () => playTrack(s, 'trending', 0, trendingSongs),
      track: s,
    })),
  ].slice(0, 6);

  const currentHeroTrack = heroTracks[heroIndex] || heroTracks[0];
  const isHeroPlaying = isPlaying && currentTrack && currentHeroTrack && currentTrack.id === currentHeroTrack.id;

  return (
    <>
      <div className="hdr-glow" />

      {/* Greeting and Filter Row */}
      <div className="greet-row">
        <h1 className="greet">{getGreeting()}</h1>
        <div className="pills" id="homePills">
          {[
            ['', 'All'],
            ['trending', 'Trending'],
            ['artists', 'Artists'],
            ['languages', 'Languages'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`pill ${activeFilter === key ? 'on' : ''}`}
              onClick={() => setActiveFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Carousel with Live Trending Hits */}
      {currentHeroTrack && (!activeFilter || activeFilter === 'trending') && (
        <div className="hf-all">
          <div
            className="hero"
            id="hero"
            onMouseEnter={() => {
              isHoveredRef.current = true;
            }}
            onMouseLeave={() => {
              isHoveredRef.current = false;
            }}
          >
            {heroTracks.map((hSong, idx) => {
              const thumb = getOptimizedThumbnail(hSong.thumbnail, settings);
              const isOn = idx === heroIndex;
              const isSlidePlaying = isPlaying && currentTrack?.id === hSong.id;

              return (
                <article
                  key={hSong.id}
                  className={`hero-slide ${isOn ? 'on' : ''}`}
                  aria-label={`${idx + 1} of ${heroTracks.length}`}
                >
                  <div className="hero-bg" style={{ backgroundImage: `url('${thumb}')` }} />
                  <div className="hero-copy">
                    <span className="hero-eyebrow">TRENDING ON YOUTUBE MUSIC</span>
                    <h2 className="hero-title">{hSong.title}</h2>
                    <p className="hero-desc">{hSong.artist} • {hSong.durationText || 'High-Quality Audio Stream'}</p>
                    <div className="hero-actions">
                      <button
                        className={`btn btn-accent pp ${isSlidePlaying ? 'is-playing' : ''}`}
                        onClick={() => {
                          if (isSlidePlaying) togglePlay();
                          else playTrack(hSong, 'trending', idx, trendingSongs);
                        }}
                      >
                        <Icon name="play" className="ic-play" />
                        <Icon name="pause" className="ic-pause" />
                        <span className="lbl-play">Play now</span>
                        <span className="lbl-pause">Pause</span>
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '10px 14px' }}
                        onClick={() => setSelectedTrackForOptions(hSong)}
                        aria-label="Track options"
                      >
                        <Icon name="more" className="i-16" />
                      </button>
                    </div>
                  </div>

                  <div className="hero-visual">
                    <div className="hero-vinyl">
                      <div className="disc">
                        <img src={thumb} alt="" />
                      </div>
                    </div>
                    <img className="hero-cover" src={thumb} alt={hSong.title} />
                  </div>
                </article>
              );
            })}

            {heroTracks.length > 1 && (
              <div className="hero-dots">
                {heroTracks.map((_, i) => (
                  <button
                    key={i}
                    className={`hero-dot ${i === heroIndex ? 'on' : ''}`}
                    onClick={() => {
                      setHeroIndex(i);
                      setHeroProgress(0);
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    <i
                      style={{
                        transform: i === heroIndex ? `scaleX(${heroProgress})` : 'scaleX(0)',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Picks / Shortcuts (Snitify UX 6-Grid) */}
          {loading && quickPicks.length <= 1 ? (
            <ShortcutsGridSkeleton />
          ) : (
            <div className="quick">
              {quickPicks.map((q, i) => {
                const isCurrent = q.track && currentTrack?.id === q.track.id;
                const isPlayingCurrent = isPlaying && isCurrent;

                return (
                  <div
                    key={i}
                    className={`qp ${isCurrent ? 'current' : ''}`}
                    style={{ '--i': i }}
                    onClick={q.action}
                  >
                    <img src={q.img} alt="" />
                    <span className="qp-name">{q.title}</span>
                    <span className="eq">
                      <i /><i /><i /><i />
                    </span>
                    <button
                      className={`play-btn pp ${isPlayingCurrent ? 'is-playing' : ''}`}
                      aria-label={`Play ${q.title}`}
                      onClick={e => {
                        e.stopPropagation();
                        q.action();
                      }}
                    >
                      <Icon name="play" className="ic-play" />
                      <Icon name="pause" className="ic-pause" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── SECTION: YOUR FAVORITE ARTISTS (Snitify UX) ─── */}
      {(!activeFilter || activeFilter === 'artists') && (
        <section className="shelf">
          <div className="shelf-head">
            <div>
              <p className="shelf-sub">Based on your tastes</p>
              <h2 className="shelf-title">Your favorite artists</h2>
            </div>
            {onOpenOnboarding && (
              <button
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={onOpenOnboarding}
              >
                Edit Artists
              </button>
            )}
          </div>
          {loading ? (
            <ArtistShelfSkeleton count={6} />
          ) : (
            <div className="track" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
              {userArtists.map((artistName, idx) => {
                const img = artistImages[artistName] || INITIAL_ARTIST_IMAGES_MAP[artistName];
                return (
                  <div
                    key={artistName}
                    className="card round"
                    style={{ '--i': idx, minWidth: '120px', maxWidth: '140px', cursor: 'pointer' }}
                    onClick={() => {
                      if (onSelectQuery) onSelectQuery(artistName);
                      else onNavigate('search');
                    }}
                  >
                    <div className="card-media">
                      <div
                        className="card-art"
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          margin: '0 auto',
                          background: '#222',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                        }}
                      >
                        {img ? (
                          <img
                            src={getOptimizedThumbnail(img, settings)}
                            alt={artistName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                              fontWeight: 800,
                              color: '#fff',
                              background: 'linear-gradient(135deg, #333, #1f1f1f)',
                            }}
                          >
                            {artistName.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="card-title" style={{ textAlign: 'center', marginTop: '10px' }}>
                      {artistName}
                    </span>
                    <div className="card-sub" style={{ textAlign: 'center' }}>
                      Artist
                    </div>
                  </div>
                );
              })}

              {/* Add Artist Card */}
              {onOpenOnboarding && (
                <div
                  className="card round"
                  style={{ minWidth: '120px', maxWidth: '140px', cursor: 'pointer' }}
                  onClick={onOpenOnboarding}
                >
                  <div className="card-media">
                    <div
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1.5px dashed rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        margin: '0 auto',
                      }}
                    >
                      <Icon name="plus" className="i-24" />
                    </div>
                  </div>
                  <span className="card-title" style={{ textAlign: 'center', marginTop: '10px' }}>
                    Add Artists
                  </span>
                  <div className="card-sub" style={{ textAlign: 'center' }}>
                    Discover
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ─── SECTION: IN YOUR LANGUAGES (Snitify UX) ─── */}
      {(!activeFilter || activeFilter === 'languages') && (
        <section className="shelf">
          <div className="shelf-head">
            <div>
              <p className="shelf-sub">Top streams by language</p>
              <h2 className="shelf-title">In your languages</h2>
            </div>
            {onOpenOnboarding && (
              <button
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={onOpenOnboarding}
              >
                Edit Languages
              </button>
            )}
          </div>
          <div className="track" style={{ overflowX: 'auto', paddingBottom: '8px', gap: '14px' }}>
            {userLanguages.map((langName, idx) => {
              const langInfo = GLOBAL_LANGUAGES.find(l => l.name === langName) || {
                colors: ['#00587a', '#008891'],
                native: langName,
              };

              return (
                <div
                  key={langName}
                  style={{
                    minWidth: '160px',
                    height: '90px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${langInfo.colors[0]}, ${langInfo.colors[1]})`,
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    transition: 'transform .15s',
                  }}
                  onClick={() => onNavigate('search')}
                >
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{langName}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{langInfo.native}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── PERSONALIZED RECOMMENDATIONS FOR USER'S ARTIST ─── */}
      {artistShelves.map((shelf, idx) => (
        <section className="shelf" key={idx}>
          <div className="shelf-head">
            <div>
              <p className="shelf-sub">Because you like</p>
              <h2 className="shelf-title">{shelf.artist} Hits</h2>
            </div>
          </div>
          <div className="track">
            {shelf.songs.map((song, i) => {
              const thumb = getOptimizedThumbnail(song.thumbnail, settings);
              const isSongPlaying = isPlaying && currentTrack?.id === song.id;

              return (
                <div
                  key={song.id}
                  className="card"
                  style={{ '--i': i }}
                  onClick={() => playTrack(song, `artist:${shelf.artist}`, i, shelf.songs)}
                >
                  <div className="card-media">
                    <div className="card-art">
                      <img src={thumb} alt="" loading="lazy" />
                    </div>
                    <button
                      className={`play-btn pp ${isSongPlaying ? 'is-playing' : ''}`}
                      aria-label="Play"
                      onClick={e => {
                        e.stopPropagation();
                        playTrack(song, `artist:${shelf.artist}`, i, shelf.songs);
                      }}
                    >
                      <Icon name="play" className="ic-play" />
                      <Icon name="pause" className="ic-pause" />
                    </button>
                    <button
                      className="card-more-btn"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedTrackForOptions(song);
                      }}
                    >
                      <Icon name="more" className="i-16" />
                    </button>
                  </div>
                  <span className="card-title">{song.title}</span>
                  <div className="card-sub">{song.artist}</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* ─── PERSONALIZED RECOMMENDATIONS FOR USER'S LANGUAGE ─── */}
      {languageShelves.map((shelf, idx) => (
        <section className="shelf" key={idx}>
          <div className="shelf-head">
            <div>
              <p className="shelf-sub">Trending Chart</p>
              <h2 className="shelf-title">Top {shelf.language} Hits</h2>
            </div>
          </div>
          <div className="track">
            {shelf.songs.map((song, i) => {
              const thumb = getOptimizedThumbnail(song.thumbnail, settings);
              const isSongPlaying = isPlaying && currentTrack?.id === song.id;

              return (
                <div
                  key={song.id}
                  className="card"
                  style={{ '--i': i }}
                  onClick={() => playTrack(song, `lang:${shelf.language}`, i, shelf.songs)}
                >
                  <div className="card-media">
                    <div className="card-art">
                      <img src={thumb} alt="" loading="lazy" />
                    </div>
                    <button
                      className={`play-btn pp ${isSongPlaying ? 'is-playing' : ''}`}
                      aria-label="Play"
                      onClick={e => {
                        e.stopPropagation();
                        playTrack(song, `lang:${shelf.language}`, i, shelf.songs);
                      }}
                    >
                      <Icon name="play" className="ic-play" />
                      <Icon name="pause" className="ic-pause" />
                    </button>
                    <button
                      className="card-more-btn"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedTrackForOptions(song);
                      }}
                    >
                      <Icon name="more" className="i-16" />
                    </button>
                  </div>
                  <span className="card-title">{song.title}</span>
                  <div className="card-sub">{song.artist}</div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Trending Global Hits Shelf */}
      {trendingSongs.length > 0 && (!activeFilter || activeFilter === 'trending') && (
        <section className="shelf">
          <div className="shelf-head">
            <div>
              <p className="shelf-sub">Top streams right now</p>
              <h2 className="shelf-title">Trending Global Hits</h2>
            </div>
          </div>
          <div className="track">
            {trendingSongs.slice(0, 16).map((song, i) => {
              const thumb = getOptimizedThumbnail(song.thumbnail, settings);
              const isSongPlaying = isPlaying && currentTrack?.id === song.id;

              return (
                <div
                  key={song.id}
                  className="card"
                  style={{ '--i': i }}
                  onClick={() => playTrack(song, 'trending', i, trendingSongs)}
                >
                  <div className="card-media">
                    <div className="card-art">
                      <img src={thumb} alt="" loading="lazy" />
                    </div>
                    <button
                      className={`play-btn pp ${isSongPlaying ? 'is-playing' : ''}`}
                      aria-label="Play"
                      onClick={e => {
                        e.stopPropagation();
                        playTrack(song, 'trending', i, trendingSongs);
                      }}
                    >
                      <Icon name="play" className="ic-play" />
                      <Icon name="pause" className="ic-pause" />
                    </button>
                    <button
                      className="card-more-btn"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedTrackForOptions(song);
                      }}
                    >
                      <Icon name="more" className="i-16" />
                    </button>
                  </div>
                  <span className="card-title">{song.title}</span>
                  <div className="card-sub">{song.artist}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Explore Shelves */}
      {exploreShelves.map((shelf, sIdx) => {
        if (!shelf.items || shelf.items.length === 0) return null;

        return (
          <section className="shelf" key={sIdx}>
            <div className="shelf-head">
              <div>
                <h2 className="shelf-title">{shelf.title}</h2>
              </div>
            </div>
            <div className="track">
              {shelf.items.slice(0, 12).map((item, i) => {
                const thumb = getOptimizedThumbnail(item.thumbnail, settings);
                return (
                  <div
                    key={item.id || i}
                    className="card"
                    style={{ '--i': i }}
                    onClick={() => {
                      if (item.id) {
                        playTrack({
                          id: item.id,
                          title: item.title,
                          artist: item.subtitle,
                          thumbnail: item.thumbnail,
                        }, 'explore', i);
                      }
                    }}
                  >
                    <div className="card-media">
                      <div className="card-art">
                        <img src={thumb} alt="" loading="lazy" />
                      </div>
                      <button
                        className="play-btn pp"
                        aria-label="Play"
                        onClick={e => {
                          e.stopPropagation();
                          if (item.id) {
                            playTrack({
                              id: item.id,
                              title: item.title,
                              artist: item.subtitle,
                              thumbnail: item.thumbnail,
                            }, 'explore', i);
                          }
                        }}
                      >
                        <Icon name="play" className="ic-play" />
                        <Icon name="pause" className="ic-pause" />
                      </button>
                    </div>
                    <span className="card-title">{item.title}</span>
                    <div className="card-sub">{item.subtitle}</div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Skeletons while loading */}
      {loading && trendingSongs.length === 0 && (
        <div style={{ marginTop: '20px' }}>
          <ShelfSkeleton count={5} />
        </div>
      )}

      {/* Track Options Menu Bottom Sheet */}
      {selectedTrackForOptions && (
        <TrackOptionsMenu
          track={selectedTrackForOptions}
          isOpen={!!selectedTrackForOptions}
          onClose={() => setSelectedTrackForOptions(null)}
          onOpenSaveToPlaylist={track => setTrackForPlaylistModal(track)}
          onNavigate={onNavigate}
          onShowToast={onShowToast}
        />
      )}

      {/* Save to Playlist Modal */}
      {trackForPlaylistModal && (
        <SaveToPlaylistModal
          track={trackForPlaylistModal}
          isOpen={!!trackForPlaylistModal}
          onClose={() => setTrackForPlaylistModal(null)}
          onShowToast={onShowToast}
        />
      )}

      {/* Footer */}
      <footer className="site-foot">
        <div className="foot-cols">
          <div>
            <h4>Redline</h4>
            <span>High-Fidelity Audio</span>
            <span>Adaptive Bitrate</span>
          </div>
          <div>
            <h4>Snitify UX</h4>
            <span>Dynamic Recommendations</span>
            <span>Personalized Feed</span>
          </div>
          <div>
            <h4>Preferences</h4>
            <span style={{ cursor: 'pointer' }} onClick={() => onNavigate('settings')}>Settings</span>
            {onOpenOnboarding && (
              <span style={{ cursor: 'pointer' }} onClick={onOpenOnboarding}>Edit Onboarding Preferences</span>
            )}
          </div>
        </div>
        <div className="rule" />
        <p>© 2026 Redline Music · Powered by YouTube Music direct streaming & Snitify UX architecture.</p>
      </footer>
    </>
  );
}
