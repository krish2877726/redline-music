import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../components/SvgIcons.jsx';
import { PL, TR, ALB, ART, PLAYLISTS, art, durText, fmt, nf, hdrOf, PAL, shade } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';
import { TrackOptionsMenu } from '../components/TrackOptionsMenu.jsx';
import { SaveToPlaylistModal } from '../components/SaveToPlaylistModal.jsx';
import { PlaylistOptionsMenuModal } from '../components/PlaylistOptionsMenuModal.jsx';

function resolveTrack(item) {
  if (!item) return null;
  if (typeof item === 'object') {
    return {
      id: item.id,
      title: item.title || 'Unknown Title',
      artist: item.artist || 'Unknown Artist',
      artistId: item.artistId || '',
      album: item.album || '',
      albumId: item.albumId || '',
      duration: item.duration || 0,
      durationText: item.durationText || fmt(item.duration || 0),
      thumbnail: item.thumbnail || '',
      explicit: !!item.explicit,
      raw: item,
    };
  }
  const t = TR[item];
  if (t) {
    const a = ALB[t.album];
    const ar = ART[t.artist];
    return {
      id: t.id,
      title: t.title,
      artist: ar ? ar.name : 'Unknown Artist',
      artistId: ar ? ar.id : '',
      album: a ? a.title : '',
      albumId: a ? a.id : '',
      duration: t.dur || 0,
      durationText: fmt(t.dur || 0),
      thumbnail: a ? art.album(a) : art.liked(),
      explicit: !!t.explicit,
      raw: t,
    };
  }
  return {
    id: item,
    title: item.replace(/^yt:/, ''),
    artist: 'YouTube Music',
    artistId: '',
    album: '',
    albumId: '',
    duration: 180,
    durationText: '3:00',
    thumbnail: '',
    explicit: false,
    raw: { id: item },
  };
}

export function PlaylistView({ playlistId, onNavigate, onSetHdr, onShowToast }) {
  const {
    currentTrack,
    isPlaying,
    currentContext,
    likedTracks,
    savedPlaylists,
    customPlaylists,
    deletePlaylist,
    renamePlaylist,
    removeTrackFromPlaylist,
    playTrack,
    playContext,
    togglePlay,
    toggleLike,
    toggleSavePlaylist,
  } = usePlayer();

  const { settings } = useSettings();

  const isLikedPlaylist = playlistId === 'liked';
  const isCustomPlaylist = playlistId?.startsWith('pl_');
  const customPlaylist = isCustomPlaylist
    ? (customPlaylists || []).find(p => p.id === playlistId)
    : null;
  const systemPlaylist = !isLikedPlaylist && !isCustomPlaylist ? PL[playlistId] : null;

  // Filter & Sort State
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'title_az', 'artist_az', 'album_az', 'duration'

  // Modals & Options
  const [optionsTrack, setOptionsTrack] = useState(null);
  const [saveModalTrack, setSaveModalTrack] = useState(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  if (!isLikedPlaylist && !customPlaylist && !systemPlaylist) {
    return (
      <div className="empty" style={{ paddingTop: '120px' }}>
        <Icon name="disc" />
        <h2>Playlist not found</h2>
        <p>This playlist isn't available.</p>
        <button className="btn btn-light" onClick={() => onNavigate('home')}>
          Back home
        </button>
      </div>
    );
  }

  // Header Data
  const title = isLikedPlaylist
    ? 'Liked Songs'
    : isCustomPlaylist
    ? customPlaylist.title
    : systemPlaylist.title;

  const desc = isLikedPlaylist
    ? 'Songs you have marked with a heart'
    : isCustomPlaylist
    ? 'Your custom collection'
    : systemPlaylist.desc;

  // Raw tracks before filtering & sorting
  const rawItems = useMemo(() => {
    if (isLikedPlaylist) {
      return [...likedTracks].reverse();
    }
    if (isCustomPlaylist) {
      return customPlaylist.tracks || [];
    }
    return systemPlaylist.trackIds || [];
  }, [isLikedPlaylist, isCustomPlaylist, customPlaylist, systemPlaylist, likedTracks]);

  // Resolved track objects
  const resolvedTracks = useMemo(() => {
    return rawItems.map(resolveTrack).filter(Boolean);
  }, [rawItems]);

  // Image
  const img = isLikedPlaylist
    ? art.liked()
    : isCustomPlaylist
    ? (resolvedTracks[0]?.thumbnail ? getOptimizedThumbnail(resolvedTracks[0].thumbnail, settings) : art.liked())
    : art.playlist(systemPlaylist);

  // Filter & Sort tracks
  const processedTracks = useMemo(() => {
    let list = [...resolvedTracks];

    // Filter
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      list = list.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'title_az') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'artist_az') {
      list.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (sortBy === 'album_az') {
      list.sort((a, b) => (a.album || '').localeCompare(b.album || ''));
    } else if (sortBy === 'duration') {
      list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    return list;
  }, [resolvedTracks, filterQuery, sortBy]);

  const totalDuration = resolvedTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const isSaved = !isLikedPlaylist && !isCustomPlaylist && savedPlaylists.has(playlistId);
  const isPlaylistPlaying = isPlaying && currentContext === `playlist:${playlistId}`;

  // Header background theme
  useEffect(() => {
    if (isLikedPlaylist) {
      onSetHdr('#3f1d8c');
    } else if (isCustomPlaylist) {
      onSetHdr('#8c2d19');
    } else if (systemPlaylist?.pal != null) {
      onSetHdr(hdrOf(PAL[systemPlaylist.pal]));
    } else if (systemPlaylist?.style === 'mix') {
      onSetHdr(shade(systemPlaylist.mixColor, 0.2));
    } else {
      onSetHdr('#5a1c12');
    }
  }, [playlistId, isLikedPlaylist, isCustomPlaylist, systemPlaylist]);

  const handleStartRename = () => {
    setNewTitle(title);
    setIsEditingTitle(true);
  };

  const handleSaveRename = e => {
    e.preventDefault();
    if (newTitle.trim() && isCustomPlaylist) {
      renamePlaylist(playlistId, newTitle.trim());
      onShowToast(`Renamed to "${newTitle.trim()}"`);
    }
    setIsEditingTitle(false);
  };

  const handleDeleteCustom = () => {
    if (window.confirm(`Delete playlist "${title}"?`)) {
      deletePlaylist(playlistId);
      onShowToast('Playlist deleted');
      onNavigate('library');
    }
  };

  const handlePlayAll = () => {
    if (isPlaylistPlaying) {
      togglePlay();
      return;
    }
    if (processedTracks.length === 0) return;
    playTrack(processedTracks[0].raw || processedTracks[0], `playlist:${playlistId}`, 0, processedTracks.map(t => t.raw || t));
  };

  const handleShuffle = () => {
    if (processedTracks.length === 0) return;
    const rndIdx = Math.floor(Math.random() * processedTracks.length);
    playTrack(processedTracks[rndIdx].raw || processedTracks[rndIdx], `playlist:${playlistId}`, rndIdx, processedTracks.map(t => t.raw || t));
    onShowToast('Shuffle play');
  };

  return (
    <div className="playlist-view">
      <div className="hdr-glow" />

      {/* Header */}
      <header className="phead">
        <img className="phead-art" src={img} alt={title} />
        <div className="phead-info">
          <span className="phead-type">
            {isLikedPlaylist ? 'Playlist' : isCustomPlaylist ? 'Custom Playlist' : 'Public playlist'}
          </span>

          {isEditingTitle ? (
            <form onSubmit={handleSaveRename} style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '4px 0 10px' }}>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
                className="stb-search-input"
                style={{
                  background: 'var(--surface-2)',
                  fontSize: '28px',
                  fontWeight: 800,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--accent)',
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                Save
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '8px 16px' }}
                onClick={() => setIsEditingTitle(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <h1 className={`phead-title ${title.length > 16 ? 'long' : ''}`}>
              {title}
              {isCustomPlaylist && (
                <button
                  onClick={handleStartRename}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    marginLeft: '12px',
                    cursor: 'pointer',
                    verticalAlign: 'middle',
                  }}
                  title="Rename playlist"
                >
                  <Icon name="edit" className="i-20" />
                </button>
              )}
            </h1>
          )}

          <p className="phead-desc">{desc}</p>

          <div className="phead-meta">
            {isLikedPlaylist || isCustomPlaylist ? (
              <>
                <img className="mini-av" src={art.me()} alt="" />
                <b>You</b>
                <span className="sep">•</span>
                <span>{resolvedTracks.length} songs</span>
                {totalDuration > 0 && (
                  <>
                    <span className="sep">•</span>
                    <span>about {durText(totalDuration)}</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="pin">
                  <Icon name="verified" className="i-16" />
                </span>
                <b>Redline</b>
                <span className="sep">•</span>
                <span>{nf(systemPlaylist.saves || 0)} saves</span>
                <span className="sep">•</span>
                <span>
                  {resolvedTracks.length} songs, about {durText(totalDuration)}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="pbody">
        {/* Action Controls */}
        <div className="actions">
          <button
            className={`play-btn lg pp ${isPlaylistPlaying ? 'is-playing' : ''}`}
            onClick={handlePlayAll}
            aria-label="Play playlist"
          >
            <Icon name="play" className="ic-play" />
            <Icon name="pause" className="ic-pause" />
          </button>

          <button
            className="act-icon"
            onClick={handleShuffle}
            title="Shuffle play"
            aria-label="Shuffle play"
          >
            <Icon name="shuffle" />
          </button>

          {isCustomPlaylist && (
            <button
              className="act-icon"
              onClick={handleDeleteCustom}
              title="Delete playlist"
              aria-label="Delete playlist"
            >
              <Icon name="trash" />
            </button>
          )}

          {!isLikedPlaylist && !isCustomPlaylist && (
            <button
              className={`act-icon ${isSaved ? 'on' : ''}`}
              onClick={() => {
                toggleSavePlaylist(systemPlaylist.id);
                onShowToast(isSaved ? 'Removed from Your Library' : 'Saved to Your Library');
              }}
              aria-label="Save to library"
            >
              <Icon name="heart" />
              <Icon name="heart-fill" />
            </button>
          )}

          <button
            className="act-icon"
            onClick={() => onShowToast('Downloaded for offline listening')}
            title="Download"
            aria-label="Download"
          >
            <Icon name="download" />
          </button>

          <button
            className="act-icon"
            onClick={() => setShowPlaylistMenu(true)}
            title="More playlist options"
            aria-label="More playlist options"
          >
            <Icon name="more" />
          </button>
        </div>

        {/* In-Playlist Search & Sort Bar (Searches STRICTLY inside this playlist) */}
        {resolvedTracks.length > 0 && (
          <div className="pl-filter-bar">
            <div className="pl-search-box">
              <Icon name="search" className="i-16" />
              <input
                type="text"
                placeholder={isLikedPlaylist ? "Search in Liked Songs..." : `Search in ${title}...`}
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
              />
              {filterQuery && (
                <span className="clear-btn" onClick={() => setFilterQuery('')}>
                  ×
                </span>
              )}
            </div>

            <div className="pl-sort-box">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="pl-sort-select"
              >
                <option value="default">Custom order</option>
                <option value="title_az">Title (A-Z)</option>
                <option value="artist_az">Artist (A-Z)</option>
                <option value="album_az">Album (A-Z)</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        )}

        {/* Tracks List */}
        {processedTracks.length > 0 ? (
          <div className="tl">
            <div className="tl-head">
              <span style={{ textAlign: 'center' }}>#</span>
              <span>Title</span>
              <span>Album</span>
              <span className="r">
                <Icon name="clock" className="i-16" />
              </span>
            </div>

            {processedTracks.map((track, idx) => {
              const isPlayingThis = isPlaying && currentTrack?.id === track.id;
              const isLiked = likedTracks.has(track.id);
              const thumb = getOptimizedThumbnail(track.thumbnail, settings);

              return (
                <div
                  key={track.id + '-' + idx}
                  className={`tr ${isPlayingThis ? 'playing' : ''}`}
                  style={{ '--i': Math.min(idx, 14) }}
                  onClick={() => {
                    playTrack(
                      track.raw || track,
                      `playlist:${playlistId}`,
                      idx,
                      processedTracks.map(t => t.raw || t)
                    );
                  }}
                >
                  <div className="tr-num">
                    <span className="n">{idx + 1}</span>
                    <span className="tr-play">
                      <Icon name="play" className="i-16" />
                    </span>
                    <span className="eq">
                      <i /><i /><i /><i />
                    </span>
                  </div>

                  <div className="tr-main">
                    <img src={thumb} alt="" loading="lazy" />
                    <div className="tr-text">
                      <div className="tr-title">{track.title}</div>
                      <div className="tr-artist">
                        {track.explicit && <span className="explicit">E</span>}
                        <button
                          className="muted"
                          onClick={e => {
                            e.stopPropagation();
                            if (track.artistId) onNavigate('artist', track.artistId);
                          }}
                        >
                          {track.artist}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    className="tr-album muted"
                    onClick={e => {
                      e.stopPropagation();
                      if (track.albumId) onNavigate('album', track.albumId);
                    }}
                  >
                    {track.album}
                  </button>

                  <div className="tr-end">
                    <button
                      className={`tr-like ${isLiked ? 'on' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        toggleLike(track.id);
                        onShowToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
                      }}
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <Icon name="heart" className="i-16" />
                      <Icon name="heart-fill" className="i-16" />
                    </button>

                    <span className="tr-dur">{track.durationText}</span>

                    <button
                      className="tr-more"
                      title="More options"
                      onClick={e => {
                        e.stopPropagation();
                        setOptionsTrack(track);
                      }}
                    >
                      <Icon name="more" className="i-16" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : filterQuery ? (
          <div className="empty" style={{ paddingTop: '60px' }}>
            <Icon name="search" />
            <h2>No songs match “{filterQuery}”</h2>
            <p>Try searching for a different track title, artist name, or album.</p>
            <button className="btn btn-outline" onClick={() => setFilterQuery('')}>
              Clear search
            </button>
          </div>
        ) : (
          <div className="empty">
            <Icon name={isLikedPlaylist ? 'heart' : 'disc'} />
            <h2>{isLikedPlaylist ? 'Songs you like will appear here' : 'This playlist is empty'}</h2>
            <p>
              {isLikedPlaylist
                ? 'Save songs by clicking the heart icon. They will show up here, ready to stream.'
                : 'Add songs using the options menu on any track in Redline.'}
            </p>
            <button className="btn btn-light" onClick={() => onNavigate('search')}>
              Find songs
            </button>
          </div>
        )}

        {/* Recommended Playlists */}
        {!isCustomPlaylist && (
          <section className="shelf" style={{ marginTop: '36px' }}>
            <div className="shelf-head">
              <h2 className="shelf-title">Recommended for you</h2>
            </div>
            <div className="track">
              {PLAYLISTS.filter(p => p.id !== playlistId).slice(0, 6).map((rPl, i) => (
                <div
                  key={rPl.id}
                  className="card"
                  style={{ '--i': i }}
                  onClick={() => onNavigate('playlist', rPl.id)}
                >
                  <div className="card-media">
                    <div className="card-art">
                      <img src={art.playlist(rPl)} alt="" loading="lazy" />
                    </div>
                  </div>
                  <span className="card-title">{rPl.title}</span>
                  <div className="card-sub">{rPl.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Universal Track Options Menu */}
      <TrackOptionsMenu
        track={optionsTrack}
        isOpen={!!optionsTrack}
        onClose={() => setOptionsTrack(null)}
        onOpenSaveToPlaylist={t => {
          setSaveModalTrack(t);
        }}
        onRemoveFromPlaylist={
          isCustomPlaylist
            ? () => {
                removeTrackFromPlaylist(playlistId, optionsTrack.id);
                onShowToast('Removed from playlist');
              }
            : isLikedPlaylist
            ? () => {
                toggleLike(optionsTrack.id);
                onShowToast('Removed from Liked Songs');
              }
            : null
        }
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

      {/* Spotify Playlist Header Options Menu */}
      <PlaylistOptionsMenuModal
        isOpen={showPlaylistMenu}
        onClose={() => setShowPlaylistMenu(false)}
        playlistTitle={title}
        playlistCover={img}
        playlistSubtitle={isLikedPlaylist ? 'Playlist • You' : isCustomPlaylist ? 'Custom Playlist • You' : 'Public Playlist • Redline'}
        isCustom={isCustomPlaylist}
        isLiked={isLikedPlaylist}
        onStartRename={handleStartRename}
        onDeletePlaylist={handleDeleteCustom}
        onShowToast={onShowToast}
      />
    </div>
  );
}
