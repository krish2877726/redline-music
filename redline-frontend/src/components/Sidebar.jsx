import React, { useState } from 'react';
import { Icon } from './SvgIcons.jsx';
import { art, PL, ALB, ART } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';

export function Sidebar({ currentView, onNavigate, onShowToast }) {
  const {
    likedTracks,
    savedAlbums,
    savedPlaylists,
    customPlaylists,
    createPlaylist,
    followedArtists,
    currentTrack,
    isPlaying,
  } = usePlayer();

  const [libFilter, setLibFilter] = useState('');

  // Collect library items
  const items = [
    {
      id: 'liked',
      kind: 'playlist',
      title: 'Liked Songs',
      sub: `Playlist • ${likedTracks.size} songs`,
      img: art.liked(),
      view: 'playlist',
      viewId: 'liked',
      pin: true,
      ctx: 'playlist:liked',
    },
  ];

  (customPlaylists || []).forEach(cp => {
    items.push({
      id: cp.id,
      kind: 'playlist',
      title: cp.title,
      sub: `Playlist • ${cp.tracks?.length || 0} songs`,
      img: cp.tracks?.[0]?.thumbnail || art.liked(),
      view: 'playlist',
      viewId: cp.id,
      ctx: `playlist:${cp.id}`,
    });
  });

  savedPlaylists.forEach(id => {
    const p = PL[id];
    if (p) {
      items.push({
        id,
        kind: 'playlist',
        title: p.title,
        sub: 'Playlist • Redline',
        img: art.playlist(p),
        view: 'playlist',
        viewId: id,
        ctx: `playlist:${id}`,
      });
    }
  });

  savedAlbums.forEach(id => {
    const a = ALB[id];
    if (a) {
      items.push({
        id,
        kind: 'album',
        title: a.title,
        sub: `Album • ${ART[a.artist]?.name || 'Artist'}`,
        img: art.album(a),
        view: 'album',
        viewId: id,
        ctx: `album:${id}`,
      });
    }
  });

  followedArtists.forEach(id => {
    const ar = ART[id];
    if (ar) {
      items.push({
        id,
        kind: 'artist',
        title: ar.name,
        sub: 'Artist',
        img: art.artist(ar),
        view: 'artist',
        viewId: id,
        round: true,
        ctx: `artist:${id}`,
      });
    }
  });

  const filteredItems = libFilter ? items.filter(it => it.kind === libFilter) : items;

  return (
    <aside className="side" aria-label="Sidebar">
      <nav className="side-top" aria-label="Main">
        <button
          className="brand"
          onClick={() => onNavigate('home')}
          aria-label="Redline home"
        >
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="#C92000" />
            <path
              className="ln"
              d="M5 17h5l2.5-6 4 11 3-8 2 3H27"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="brand-name">Redline</span>
        </button>

        <div className="nav">
          <button
            className={`nav-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
            title="Home"
          >
            <Icon name="home" />
            <Icon name="home-fill" />
            <span>Home</span>
          </button>
          <button
            className={`nav-btn ${currentView === 'search' ? 'active' : ''}`}
            onClick={() => onNavigate('search')}
            title="Search"
          >
            <Icon name="search" />
            <span>Search</span>
          </button>
          <button
            className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
            title="Settings"
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      <section className="side-lib" aria-label="Your Library">
        <div className="lib-head">
          <button
            className={`lib-title ${currentView === 'library' ? 'active' : ''}`}
            onClick={() => onNavigate('library')}
            title="Your Library"
          >
            <Icon name="library" />
            <span>Your Library</span>
          </button>
          <button
            className="icon-btn"
            id="newPl"
            title="Create playlist"
            aria-label="Create playlist"
            onClick={() => {
              const count = (customPlaylists?.length || 0) + 1;
              const newPl = createPlaylist(`My Playlist #${count}`);
              onNavigate('playlist', newPl.id);
              onShowToast(`Created My Playlist #${count}`);
            }}
          >
            <Icon name="plus" className="i-16" />
          </button>
        </div>

        <div className="pills lib-pills" id="libPills">
          <button
            className={`pill ${libFilter === 'playlist' ? 'on' : ''}`}
            onClick={() => setLibFilter(f => (f === 'playlist' ? '' : 'playlist'))}
          >
            Playlists
          </button>
          <button
            className={`pill ${libFilter === 'artist' ? 'on' : ''}`}
            onClick={() => setLibFilter(f => (f === 'artist' ? '' : 'artist'))}
          >
            Artists
          </button>
          <button
            className={`pill ${libFilter === 'album' ? 'on' : ''}`}
            onClick={() => setLibFilter(f => (f === 'album' ? '' : 'album'))}
          >
            Albums
          </button>
        </div>

        <div className="lib-list scroll" id="libList">
          {filteredItems.map((it, idx) => {
            const isCurrent =
              currentTrack &&
              ((it.kind === 'album' && currentTrack.albumId === it.viewId) ||
                (it.kind === 'artist' && currentTrack.artistId === it.viewId));

            return (
              <button
                key={it.id}
                className={`lib-item ${isCurrent ? 'current' : ''}`}
                onClick={() => onNavigate(it.view, it.viewId)}
                title={it.title}
                style={{ '--i': idx }}
              >
                <img
                  className={`lib-art ${it.round ? 'round' : ''}`}
                  src={it.img}
                  alt=""
                  loading="lazy"
                />
                <div className="lib-text">
                  <div className="lib-name">{it.title}</div>
                  <div className="lib-meta">
                    {it.pin && (
                      <span className="pin">
                        <Icon name="pin" className="i-12" />
                      </span>
                    )}
                    {it.sub}
                  </div>
                </div>
                <span className="lib-now">
                  {isPlaying ? (
                    <span className="eq" style={{ display: 'flex' }}>
                      <i /><i /><i /><i />
                    </span>
                  ) : (
                    <Icon name="vol-hi" className="i-16" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
