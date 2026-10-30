import React, { useRef, useState } from 'react';
import { Icon } from './SvgIcons.jsx';
import { fmt, clamp } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';

export function PlayerBar({ onNavigate, onShowToast }) {
  const { settings } = useSettings();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    likedTracks,
    isDraggingSeekRef,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    setFullscreenOpen,
  } = usePlayer();

  const seekTrackRef = useRef(null);
  const volTrackRef = useRef(null);
  const [dragProgress, setDragProgress] = useState(null);

  const progressFraction = dragProgress !== null ? dragProgress : duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
  const isLiked = currentTrack && likedTracks.has(currentTrack.id);

  // Seek bar interaction (pointer/touch/drag)
  const handleSeekPointerDown = e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const bar = seekTrackRef.current;
    if (!bar) return;

    isDraggingSeekRef.current = true;
    const rect = bar.getBoundingClientRect();
    const frac = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    setDragProgress(frac);

    const onPointerMove = ev => {
      const f = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      setDragProgress(f);
    };

    const onPointerUp = ev => {
      isDraggingSeekRef.current = false;
      const f = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      setDragProgress(null);
      seekTo(f * duration);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Volume bar interaction
  const handleVolPointerDown = e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const bar = volTrackRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const val = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    setVolume(val);

    const onPointerMove = ev => {
      const v = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      setVolume(v);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const effectiveVol = isMuted ? 0 : volume;
  const volIconName = effectiveVol === 0 ? 'vol-mute' : effectiveVol < 0.5 ? 'vol-lo' : 'vol-hi';

  return (
    <footer className="player" id="player" aria-label="Player">
      <div className="np" id="np">
        <button
          className="np-art"
          id="npArt"
          aria-label="Open full-screen player"
          onClick={() => setFullscreenOpen(true)}
        >
          {currentTrack?.thumbnail ? (
            <img id="npImg" src={getOptimizedThumbnail(currentTrack.thumbnail, settings)} alt="" />
          ) : (
            <div style={{ width: '56px', height: '56px', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="music" className="i-20" />
            </div>
          )}
          <span className="np-expand">
            <Icon name="chev-up" className="i-12" />
          </span>
        </button>

        <div className="np-text">
          <button
            className="np-title"
            id="npTitle"
            onClick={() => currentTrack?.albumId && onNavigate('album', currentTrack.albumId)}
          >
            {currentTrack?.title || 'No track selected'}
          </button>
          <button
            className="np-artist"
            id="npArtist"
            onClick={() => currentTrack?.artistId && onNavigate('artist', currentTrack.artistId)}
          >
            {currentTrack?.artist || ''}
          </button>
        </div>

        {currentTrack && (
          <button
            className={`act-icon np-like ${isLiked ? 'on' : ''}`}
            id="npLike"
            aria-label={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
            onClick={() => {
              toggleLike(currentTrack.id);
              onShowToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
            }}
          >
            <Icon name="heart" className="ic-heart" />
            <Icon name="heart-fill" className="ic-heart-fill" />
          </button>
        )}
      </div>

      <div className="ctrl">
        <div className="ctrl-btns">
          <button
            className={`cbtn ${shuffle ? 'on' : ''}`}
            aria-label="Shuffle"
            title="Shuffle"
            onClick={() => {
              toggleShuffle();
              onShowToast(!shuffle ? 'Shuffle on' : 'Shuffle off');
            }}
          >
            <Icon name="shuffle" />
          </button>
          <button
            className="cbtn"
            aria-label="Previous"
            title="Previous"
            onClick={prev}
          >
            <Icon name="prev" />
          </button>
          <button
            className={`main-play pp ${isPlaying ? 'is-playing' : ''}`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
          >
            <Icon name="play" className="ic-play" />
            <Icon name="pause" className="ic-pause" />
          </button>
          <button
            className="cbtn"
            aria-label="Next"
            title="Next"
            onClick={next}
          >
            <Icon name="next" />
          </button>
          <button
            className={`cbtn ${repeat > 0 ? 'on' : ''} ${repeat === 2 ? 'one' : ''}`}
            aria-label="Repeat"
            title="Repeat"
            onClick={() => {
              toggleRepeat();
              onShowToast(['Repeat off', 'Repeat all', 'Repeat one'][(repeat + 1) % 3]);
            }}
          >
            <Icon name="repeat" />
            <span className="rep1">1</span>
          </button>
        </div>

        <div className="prog">
          <time className="t-cur">{fmt(dragProgress !== null ? dragProgress * duration : currentTime)}</time>
          <div
            ref={seekTrackRef}
            className={`bar seek ${dragProgress !== null ? 'drag' : ''}`}
            id="seek"
            aria-label="Seek"
            style={{ '--p': progressFraction }}
            onPointerDown={handleSeekPointerDown}
          >
            <div className="bar-track">
              <div className="bar-fill" />
            </div>
            <div className="bar-thumb" />
          </div>
          <time className="t-dur">{fmt(duration)}</time>
        </div>
      </div>

      <div className="extra">
        <button
          className="cbtn"
          aria-label="Lyrics"
          title="Lyrics"
          onClick={() => setFullscreenOpen(true)}
        >
          <Icon name="mic" />
        </button>
        <button
          className="cbtn"
          aria-label="Queue"
          title="Queue"
          onClick={() => setFullscreenOpen(true)}
        >
          <Icon name="queue" />
        </button>
        <button
          className="cbtn"
          aria-label="Connect to a device"
          title="Connect to a device"
          onClick={() => onShowToast('Listening on This Browser')}
        >
          <Icon name="device" />
        </button>
        <div className="vol">
          <button
            className="cbtn"
            id="volBtn"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute' : 'Mute'}
            onClick={toggleMute}
          >
            <Icon name={volIconName} />
          </button>
          <div
            ref={volTrackRef}
            className="bar"
            id="vol"
            aria-label="Volume"
            style={{ '--p': effectiveVol }}
            onPointerDown={handleVolPointerDown}
          >
            <div className="bar-track">
              <div className="bar-fill" />
            </div>
            <div className="bar-thumb" />
          </div>
        </div>
        <button
          className="cbtn"
          id="fsBtn"
          aria-label="Full screen"
          title="Full screen"
          onClick={() => setFullscreenOpen(true)}
        >
          <Icon name="expand" />
        </button>
      </div>

      <div className="mini-prog">
        <i style={{ transform: `scaleX(${progressFraction})` }} />
      </div>
    </footer>
  );
}
