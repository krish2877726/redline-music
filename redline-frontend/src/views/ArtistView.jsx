import React, { useState, useEffect } from 'react';
import { Icon } from '../components/SvgIcons.jsx';
import { ART, ARTISTS, ALBUMS, art, shade, PAL, topTracks, nf, fmt } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';
import { TrackListSkeleton } from '../components/SkeletonLoaders.jsx';
import { TrackOptionsMenu } from '../components/TrackOptionsMenu.jsx';
import { SaveToPlaylistModal } from '../components/SaveToPlaylistModal.jsx';

export function ArtistView({ artistId, onNavigate, onSetHdr, onShowToast }) {
  const {
    currentTrack,
    isPlaying,
    currentContext,
    likedTracks,
    followedArtists,
    playTrack,
    playContext,
    togglePlay,
    toggleLike,
    toggleFollowArtist,
  } = usePlayer();

  const { settings } = useSettings();

  const [expandedTop, setExpandedTop] = useState(false);
  const [discoFilter, setDiscoFilter] = useState('');
  const [onlineData, setOnlineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optionsTrack, setOptionsTrack] = useState(null);
  const [saveModalTrack, setSaveModalTrack] = useState(null);

  const localArtist = ART[artistId];

  // Fetch online artist if not in local catalog
  useEffect(() => {
    if (!localArtist && artistId) {
      setLoading(true);
      fetch(`/api/music/artist/${encodeURIComponent(artistId)}`)
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          setOnlineData(data);
          setLoading(false);
        })
        .catch(err => {
          console.warn('[ArtistView] Fetch error:', err);
          setLoading(false);
        });
    }
  }, [artistId, localArtist]);

  useEffect(() => {
    if (localArtist) {
      const p = PAL[localArtist.pal] || PAL[0];
      onSetHdr(shade(p[1], 0.3));
    } else {
      onSetHdr('#1e3264');
    }
  }, [artistId, localArtist]);

  if (loading) {
    return (
      <div className="artist-view" style={{ paddingTop: '80px', paddingLeft: '32px', paddingRight: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div className="skel" style={{ width: '140px', height: '140px', borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div className="skel" style={{ width: '120px', height: '20px' }} />
            <div className="skel" style={{ width: '60%', height: '40px' }} />
            <div className="skel" style={{ width: '180px', height: '18px' }} />
          </div>
        </div>
        <TrackListSkeleton count={8} />
      </div>
    );
  }

  // If online artist loaded
  if (!localArtist && onlineData) {
    const artistName = onlineData.name || artistId;
    const isFollowed = followedArtists.has(artistId) || followedArtists.has(artistName);
    const isArtistPlaying = isPlaying && currentContext === `artist:${artistId}`;
    const songs = onlineData.songs || [];
    const thumb = getOptimizedThumbnail(onlineData.thumbnail, settings);

    return (
      <div className="artist-view">
        <header className="ahead">
          {thumb && (
            <div
              className="ahead-img"
              style={{ backgroundImage: `url('${thumb}')` }}
            />
          )}
          <div className="ahead-info">
            <span className="verified">
              <Icon name="verified" /> Verified artist
            </span>
            <h1 className="ahead-name">{artistName}</h1>
            <p className="ahead-listeners">{onlineData.subscribers || 'Official YouTube Music Artist'}</p>
          </div>
        </header>

        <div className="pbody" style={{ background: 'linear-gradient(rgba(30,50,100,0.4), transparent 300px)' }}>
          <div className="actions">
            <button
              className={`play-btn lg pp ${isArtistPlaying ? 'is-playing' : ''}`}
              onClick={() => {
                if (isArtistPlaying) togglePlay();
                else if (songs.length > 0) playTrack(songs[0], `artist:${artistId}`, 0, songs);
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
                  playTrack(songs[rnd], `artist:${artistId}`, rnd, songs);
                  onShowToast('Shuffle play');
                }}
              >
                <Icon name="shuffle" />
              </button>
            )}
            <button
              className={`btn btn-outline lg ${isFollowed ? 'on' : ''}`}
              onClick={() => {
                toggleFollowArtist(artistId);
                onShowToast(isFollowed ? `Unfollowed ${artistName}` : `Following ${artistName}`);
              }}
            >
              {isFollowed ? 'Following' : 'Follow'}
            </button>
          </div>

          <h2 className="sec-title">Popular</h2>
          <div className="tl plays">
            {songs.slice(0, expandedTop ? 20 : 8).map((track, idx) => {
              const isPlayingThis = isPlaying && currentTrack?.id === track.id;
              const isLiked = likedTracks.has(track.id);
              const songThumb = getOptimizedThumbnail(track.thumbnail, settings);

              return (
                <div
                  key={track.id}
                  className={`tr ${isPlayingThis ? 'playing' : ''}`}
                  style={{ '--i': idx }}
                  onClick={() => playTrack(track, `artist:${artistId}`, idx, songs)}
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
                    <img src={songThumb} alt="" loading="lazy" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                    <div className="tr-text">
                      <div className="tr-title">{track.title}</div>
                      <div className="tr-artist">{track.artist}</div>
                    </div>
                  </div>

                  <div className="tr-end">
                    <button
                      className={`tr-like ${isLiked ? 'on' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        toggleLike(track.id);
                        onShowToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
                      }}
                    >
                      <Icon name="heart" className="i-16" />
                      <Icon name="heart-fill" className="i-16" />
                    </button>
                    <span className="tr-dur">{track.durationText || fmt(track.duration)}</span>
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

          {songs.length > 8 && (
            <button
              className="see-more"
              onClick={() => setExpandedTop(prev => !prev)}
            >
              {expandedTop ? 'Show less' : 'See more'}
            </button>
          )}
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

  if (!localArtist) {
    return (
      <div className="empty" style={{ paddingTop: '120px' }}>
        <Icon name="user" />
        <h2>Artist not found</h2>
        <p>This artist isn’t currently listed in Redline.</p>
        <button className="btn btn-light" onClick={() => onNavigate('home')}>
          Back home
        </button>
      </div>
    );
  }

  const p = PAL[localArtist.pal] || PAL[0];
  const isFollowed = followedArtists.has(localArtist.id);
  const isArtistPlaying = isPlaying && currentContext === `artist:${localArtist.id}`;
  const popularTracks = topTracks(localArtist.id);
  const albums = ALBUMS.filter(a => a.artist === localArtist.id).sort((a, b) => b.year - a.year);
  const filteredAlbums = discoFilter === 'Album'
    ? albums.filter(a => a.type === 'Album')
    : discoFilter === 'single'
    ? albums.filter(a => a.type !== 'Album')
    : albums;

  const rank = ARTISTS.slice().sort((a, b) => b.listeners - a.listeners).findIndex(a => a.id === localArtist.id) + 1;
  const fansAlsoLike = ARTISTS.filter(a => a.id !== localArtist.id).slice(0, 6);

  return (
    <div className="artist-view">
      <header className="ahead">
        <div
          className="ahead-img"
          style={{ backgroundImage: `url('${art.artistWide(localArtist)}')` }}
        />
        <div className="ahead-info">
          <span className="verified">
            <Icon name="verified" /> Verified artist
          </span>
          <h1 className="ahead-name">{localArtist.name}</h1>
          <p className="ahead-listeners">{nf(localArtist.listeners)} monthly listeners</p>
        </div>
      </header>

      <div className="pbody" style={{ background: `linear-gradient(${shade(p[1], 0.45)}, transparent 300px)` }}>
        <div className="actions">
          <button
            className={`play-btn lg pp ${isArtistPlaying ? 'is-playing' : ''}`}
            onClick={() => {
              if (isArtistPlaying) togglePlay();
              else playContext(`artist:${localArtist.id}`, 0);
            }}
          >
            <Icon name="play" className="ic-play" />
            <Icon name="pause" className="ic-pause" />
          </button>
          <button
            className="act-icon"
            onClick={() => {
              playContext(`artist:${localArtist.id}`, Math.floor(Math.random() * popularTracks.length));
              onShowToast('Shuffle play');
            }}
          >
            <Icon name="shuffle" />
          </button>
          <button
            className={`btn btn-outline lg ${isFollowed ? 'on' : ''}`}
            onClick={() => {
              toggleFollowArtist(localArtist.id);
              onShowToast(isFollowed ? `Unfollowed ${localArtist.name}` : `Following ${localArtist.name}`);
            }}
          >
            {isFollowed ? 'Following' : 'Follow'}
          </button>
        </div>

        <h2 className="sec-title">Popular</h2>
        <div className="tl plays">
          {popularTracks.slice(0, expandedTop ? 10 : 5).map((track, idx) => {
            const isPlayingThis = isPlaying && currentTrack?.id === track.id;
            const isLiked = likedTracks.has(track.id);

            return (
              <div
                key={track.id}
                className={`tr ${isPlayingThis ? 'playing' : ''}`}
                style={{ '--i': idx }}
                onClick={() => playContext(`artist:${localArtist.id}`, idx)}
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
                  <div className="tr-text">
                    <div className="tr-title">{track.title}</div>
                  </div>
                </div>

                <span className="tr-plays">{nf(track.plays)}</span>

                <div className="tr-end">
                  <button
                    className={`tr-like ${isLiked ? 'on' : ''}`}
                    onClick={e => {
                      e.stopPropagation();
                      toggleLike(track.id);
                      onShowToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
                    }}
                  >
                    <Icon name="heart" className="i-16" />
                    <Icon name="heart-fill" className="i-16" />
                  </button>
                  <span className="tr-dur">{fmt(track.dur)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
