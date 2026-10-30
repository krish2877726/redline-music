import React, { useState, useEffect } from 'react';
import { Icon } from '../components/SvgIcons.jsx';
import { ALB, ART, TR, ALBUMS, art, hdrOf, PAL, durText, fmt } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';
import { TrackListSkeleton } from '../components/SkeletonLoaders.jsx';
import { TrackOptionsMenu } from '../components/TrackOptionsMenu.jsx';
import { SaveToPlaylistModal } from '../components/SaveToPlaylistModal.jsx';

export function AlbumView({ albumId, onNavigate, onSetHdr, onShowToast }) {
  const {
    currentTrack,
    isPlaying,
    currentContext,
    likedTracks,
    savedAlbums,
    playTrack,
    playContext,
    togglePlay,
    toggleLike,
    toggleSaveAlbum,
  } = usePlayer();

  const { settings } = useSettings();

  const [onlineData, setOnlineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optionsTrack, setOptionsTrack] = useState(null);
  const [saveModalTrack, setSaveModalTrack] = useState(null);

  const localAlbum = ALB[albumId];

  useEffect(() => {
    if (!localAlbum && albumId) {
      setLoading(true);
      fetch(`/api/music/album/${encodeURIComponent(albumId)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          setOnlineData(data);
          setLoading(false);
        })
        .catch(err => {
          console.warn('[AlbumView] Fetch error:', err);
          setLoading(false);
        });
    }
  }, [albumId, localAlbum]);

  useEffect(() => {
    if (localAlbum) {
      const p = PAL[localAlbum.pal] || PAL[0];
      onSetHdr(hdrOf(p));
    } else {
      onSetHdr('#501c38');
    }
  }, [albumId, localAlbum]);

  if (loading) {
    return (
      <div className="album-view" style={{ paddingTop: '80px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div className="skel" style={{ width: '180px', height: '180px', borderRadius: '12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div className="skel" style={{ width: '80px', height: '16px' }} />
            <div className="skel" style={{ width: '60%', height: '36px' }} />
            <div className="skel" style={{ width: '140px', height: '18px' }} />
          </div>
        </div>
        <TrackListSkeleton count={8} />
      </div>
    );
  }

  // If online album loaded
  if (!localAlbum && onlineData) {
    const title = onlineData.title || 'Album';
    const artist = onlineData.artist || 'Various Artists';
    const songs = onlineData.songs || [];
    const isSaved = savedAlbums.has(albumId);
    const isAlbumPlaying = isPlaying && currentContext === `album:${albumId}`;
    const thumb = getOptimizedThumbnail(onlineData.thumbnail, settings);
    const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);

    return (
      <div className="album-view">
        <div className="hdr-glow" />

        <header className="phead">
          {thumb ? (
            <img className="phead-art" src={thumb} alt={title} />
          ) : (
            <div className="phead-art" style={{ background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="disc" className="i-48" />
            </div>
          )}
          <div className="phead-info">
            <span className="phead-type">Album</span>
            <h1 className={`phead-title ${title.length > 16 ? 'long' : ''}`}>
              {title}
            </h1>
            <div className="phead-meta">
              <span><b>{artist}</b></span>
              <span className="sep">•</span>
              <span>{songs.length} songs</span>
              {totalDuration > 0 && (
                <>
                  <span className="sep">•</span>
                  <span>about {durText(totalDuration)}</span>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="pbody">
          <div className="actions">
            <button
              className={`play-btn lg pp ${isAlbumPlaying ? 'is-playing' : ''}`}
              onClick={() => {
                if (isAlbumPlaying) togglePlay();
                else if (songs.length > 0) playTrack(songs[0], `album:${albumId}`, 0, songs);
              }}
            >
              <Icon name="play" className="ic-play" />
              <Icon name="pause" className="ic-pause" />
            </button>

            {songs.length > 1 && (
              <button
                className="act-icon"
                onClick={() => {
                  const rnd = Math.floor(Math.random() * songs.length);
                  playTrack(songs[rnd], `album:${albumId}`, rnd, songs);
                  onShowToast('Shuffle play');
                }}
              >
                <Icon name="shuffle" />
              </button>
            )}

            <button
              className={`act-icon ${isSaved ? 'on' : ''}`}
              onClick={() => {
                toggleSaveAlbum(albumId);
                onShowToast(isSaved ? 'Removed from Your Library' : 'Saved to Your Library');
              }}
              title="Save to Your Library"
            >
              <Icon name="heart" />
              <Icon name="heart-fill" />
            </button>
          </div>

          <div className="tl">
            <div className="tl-head">
              <span style={{ textAlign: 'center' }}>#</span>
              <span>Title</span>
              <span>Artist</span>
              <span className="r">
                <Icon name="clock" className="i-16" />
              </span>
            </div>

            {songs.map((song, i) => {
              const isPlayingThis = isPlaying && currentTrack?.id === song.id;
              const isLiked = likedTracks.has(song.id);
              const songThumb = getOptimizedThumbnail(song.thumbnail, settings);

              return (
                <div
                  key={song.id}
                  className={`tr ${isPlayingThis ? 'playing' : ''}`}
                  style={{ '--i': i }}
                  onClick={() => playTrack(song, `album:${albumId}`, i, songs)}
                >
                  <div className="tr-num">
                    <span className="n">{i + 1}</span>
                    <span className="tr-play">
                      <Icon name="play" className="i-16" />
                    </span>
                    <span className="eq">
                      <i /><i /><i /><i />
                    </span>
                  </div>

                  <div className="tr-main">
                    <img src={songThumb} alt="" loading="lazy" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div className="tr-text">
                      <div className="tr-title">{song.title}</div>
                    </div>
                  </div>

                  <div className="tr-album-name" style={{ color: 'var(--muted)', fontSize: '14px' }}>
                    {song.artist || artist}
                  </div>

                  <div className="tr-end">
                    <button
                      className={`tr-like ${isLiked ? 'on' : ''}`}
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

        {optionsTrack && (
          <TrackOptionsMenu
            track={optionsTrack}
            onClose={() => setOptionsTrack(null)}
            onSaveToPlaylist={t => {
              setOptionsTrack(null);
              setSaveModalTrack(t);
            }}
            onShowToast={onShowToast}
          />
        )}

        {saveModalTrack && (
          <SaveToPlaylistModal
            track={saveModalTrack}
            onClose={() => setSaveModalTrack(null)}
            onShowToast={onShowToast}
          />
        )}
      </div>
    );
  }

  if (!localAlbum) {
    return (
      <div className="empty" style={{ paddingTop: '120px' }}>
        <Icon name="disc" />
        <h2>Album not found</h2>
        <p>We couldn’t find what you were looking for.</p>
        <button className="btn btn-light" onClick={() => onNavigate('home')}>
          Back home
        </button>
      </div>
    );
  }

  const artist = ART[localAlbum.artist];
  const albumArt = art.album(localAlbum);
  const totalDuration = localAlbum.trackIds.reduce((sum, tid) => sum + (TR[tid]?.dur || 0), 0);
  const isSaved = savedAlbums.has(localAlbum.id);
  const isAlbumPlaying = isPlaying && currentContext === `album:${localAlbum.id}`;

  return (
    <div className="album-view">
      <div className="hdr-glow" />

      <header className="phead">
        <img className="phead-art" src={albumArt} alt={localAlbum.title} />
        <div className="phead-info">
          <span className="phead-type">{localAlbum.type}</span>
          <h1 className={`phead-title ${localAlbum.title.length > 16 ? 'long' : ''}`}>
            {localAlbum.title}
          </h1>
          <div className="phead-meta">
            {artist && <img className="mini-av" src={art.artist(artist)} alt="" />}
            <button onClick={() => artist && onNavigate('artist', artist.id)}>
              <b>{artist?.name}</b>
            </button>
            <span className="sep">•</span>
            <span>{localAlbum.year}</span>
            <span className="sep">•</span>
            <span>{localAlbum.trackIds.length} songs</span>
            <span className="sep">•</span>
            <span>about {durText(totalDuration)}</span>
          </div>
        </div>
      </header>

      <div className="pbody">
        <div className="actions">
          <button
            className={`play-btn lg pp ${isAlbumPlaying ? 'is-playing' : ''}`}
            onClick={() => {
              if (isAlbumPlaying) togglePlay();
              else playContext(`album:${localAlbum.id}`, 0);
            }}
          >
            <Icon name="play" className="ic-play" />
            <Icon name="pause" className="ic-pause" />
          </button>
        </div>
      </div>
    </div>
  );
}
