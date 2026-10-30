import React, { useState } from 'react';
import { art, PL, ALB, ART } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';

export function LibraryView({ onNavigate }) {
  const { likedTracks, savedAlbums, savedPlaylists, followedArtists, customPlaylists } = usePlayer();
  const [filter, setFilter] = useState('');

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
      });
    } else {
      items.push({
        id,
        kind: 'album',
        title: 'Saved Album',
        sub: 'Album',
        img: art.album({}),
        view: 'album',
        viewId: id,
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
      });
    } else {
      items.push({
        id,
        kind: 'artist',
        title: id,
        sub: 'Artist',
        img: art.artist({}),
        view: 'artist',
        viewId: id,
        round: true,
      });
    }
  });

  const filtered = filter ? items.filter(it => it.kind === filter) : items;

  return (
    <div className="library-view">
      <div className="hdr-glow" />
      <h1 className="page-title">Your Library</h1>

      <div className="pills sres-pills lv-pills">
        {[
          ['', 'All'],
          ['playlist', 'Playlists'],
          ['album', 'Albums'],
          ['artist', 'Artists'],
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

      <div className="grid" id="libGrid">
        {filtered.map((item, idx) => (
          <div
            key={item.id}
            className={`card ${item.round ? 'round' : ''}`}
            style={{ '--i': idx }}
            onClick={() => onNavigate(item.view, item.viewId)}
          >
            <div className="card-media">
              <div className="card-art">
                <img src={item.img} alt="" />
              </div>
            </div>
            <span className="card-title">{item.title}</span>
            <div className="card-sub">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
