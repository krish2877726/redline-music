import React, { useRef, useEffect, useState } from 'react';
import { Icon } from './SvgIcons.jsx';
import { fmt, clamp, ctxInfo } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';

export function FullScreenPlayer({ onNavigate, onShowToast }) {
  const {
    currentTrack,
    currentContext,
    isPlaying,
    currentTime,
    duration,
    shuffle,
    repeat,
    fullscreenOpen,
    setFullscreenOpen,
    lyrics,
    activeLyricIndex,
    likedTracks,
    analyserNode,
    togglePlay,
    next,
    prev,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
  } = usePlayer();

  const { settings } = useSettings();

  const fsRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const activeLyricRef = useRef(null);
  const vizContainerRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  const isLiked = currentTrack && likedTracks.has(currentTrack.id);
  const fromInfo = ctxInfo(currentContext);

  // Auto-scroll lyrics smoothly to current line
  useEffect(() => {
    if (!fullscreenOpen || activeLyricIndex < 0 || !activeLyricRef.current || !lyricsContainerRef.current) return;
    const container = lyricsContainerRef.current;
    const target = activeLyricRef.current;
    const offset = target.offsetTop - container.clientHeight * 0.4 + target.clientHeight / 2;
    container.scrollTo({
      top: Math.max(0, offset),
      behavior: 'smooth',
    });
  }, [activeLyricIndex, fullscreenOpen]);

  // Real-time Visualizer bars driven by Web Audio API AnalyserNode
  useEffect(() => {
    if (!fullscreenOpen) return;
    let animId;
    const bars = vizContainerRef.current ? [...vizContainerRef.current.children] : [];
    if (!bars.length) return;

    const dataArray = new Uint8Array(bars.length);

    const updateBars = () => {
      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
        bars.forEach((bar, i) => {
          const val = dataArray[i] / 255;
          const scale = Math.max(0.08, val * 1.1);
          bar.style.transform = `scaleY(${scale.toFixed(3)})`;
        });
      } else {
        // Subtle resting wave
        const t = performance.now() / 1000;
        bars.forEach((bar, i) => {
          const val = isPlaying ? 0.2 + 0.6 * Math.abs(Math.sin(t * 3 + i * 0.3)) : 0.06;
          bar.style.transform = `scaleY(${val.toFixed(3)})`;
        });
      }
      animId = requestAnimationFrame(updateBars);
    };

    animId = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(animId);
  }, [fullscreenOpen, analyserNode, isPlaying]);

  // Mobile swipe down to close
  const handleTouchStart = e => {
    if (window.innerWidth >= 768) return;
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = e => {
    if (!isDragging) return;
    const dy = Math.max(0, e.touches[0].clientY - startYRef.current);
    setDragY(dy);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 120) {
      setFullscreenOpen(false);
    }
    setDragY(0);
  };

  if (!fullscreenOpen) return null;

  return (
    <section
      ref={fsRef}
      className="fs open"
      id="fs"
      aria-label="Full-screen player"
      style={{
        transform: dragY > 0 ? `translateY(${dragY}px)` : 'none',
        transition: isDragging ? 'none' : 'transform .4s cubic-bezier(.16,1,.3,1)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="fs-bg">
        <i className="blob" />
        <i className="blob" />
        <i className="blob" />
      </div>

      <header className="fs-top" id="fsTop">
        <button
          className="tb-btn"
          aria-label="Close full-screen player"
          onClick={() => setFullscreenOpen(false)}
        >
          <Icon name="chev-down" className="i-20" />
        </button>
        <div className="fs-from">
          <span>Playing from</span>
          <b id="fsFrom">{fromInfo.title}</b>
        </div>
        <button
          className="tb-btn"
          id="fsMore"
          aria-label="More options"
          onClick={() => onShowToast('More options')}
        >
          <Icon name="more" className="i-20" />
        </button>
      </header>

      <div className="fs-body">
        <div className="fs-visual" id="fsVisual">
          {settings.vinylSpin && (
            <div className="fs-vinyl">
              <div className="disc">
                <img id="fsDiscImg" src={getOptimizedThumbnail(currentTrack?.thumbnail, settings)} alt="" />
              </div>
            </div>
          )}
          <img className="fs-cover" id="fsImg" src={getOptimizedThumbnail(currentTrack?.thumbnail, settings)} alt="" />
        </div>

        <div className="fs-lyrics" id="fsLyrics" ref={lyricsContainerRef}>
          <div className="ly-inner" id="lyInner">
            {lyrics.synced && lyrics.synced.length > 0 ? (
              lyrics.synced.map((line, idx) => {
                const isCurrent = idx === activeLyricIndex;
                const isPast = idx < activeLyricIndex;

                return (
                  <p
                    key={idx}
                    ref={isCurrent ? activeLyricRef : null}
                    className={`ly ${isCurrent ? 'now' : ''} ${isPast ? 'past' : ''}`}
                    onClick={() => seekTo(line.time)}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : (
              <p className="ly-empty">
                <Icon name="mic" />
                <span>{lyrics.plain || 'Instrumental. Just vibes.'}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <footer className="fs-bottom">
        <div className="fs-meta">
          <div>
            <h2 id="fsTitle">{currentTrack?.title}</h2>
            <button
              id="fsArtist"
              className="muted"
              onClick={() => {
                setFullscreenOpen(false);
                if (currentTrack?.artistId) onNavigate('artist', currentTrack.artistId);
              }}
            >
              {currentTrack?.artist}
            </button>
          </div>
          {currentTrack && (
            <button
              className={`act-icon ${isLiked ? 'on' : ''}`}
              id="fsLike"
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

        <div className="fs-ctrl">
          <div className="ctrl-btns">
            <button
              className={`cbtn ${shuffle ? 'on' : ''}`}
              aria-label="Shuffle"
              onClick={() => {
                toggleShuffle();
                onShowToast(!shuffle ? 'Shuffle on' : 'Shuffle off');
              }}
            >
              <Icon name="shuffle" />
            </button>
            <button className="cbtn" aria-label="Previous" onClick={prev}>
              <Icon name="prev" />
            </button>
            <button
              className={`main-play pp ${isPlaying ? 'is-playing' : ''}`}
              aria-label="Play"
              onClick={togglePlay}
            >
              <Icon name="play" className="ic-play" />
              <Icon name="pause" className="ic-pause" />
            </button>
            <button className="cbtn" aria-label="Next" onClick={next}>
              <Icon name="next" />
            </button>
            <button
              className={`cbtn ${repeat > 0 ? 'on' : ''} ${repeat === 2 ? 'one' : ''}`}
              aria-label="Repeat"
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
            <time className="t-cur">{fmt(currentTime)}</time>
            <div
              className="bar seek"
              id="fsSeek"
              aria-label="Seek"
              style={{ '--p': duration > 0 ? clamp(currentTime / duration, 0, 1) : 0 }}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const frac = clamp((e.clientX - rect.left) / rect.width, 0, 1);
                seekTo(frac * duration);
              }}
            >
              <div className="bar-track">
                <div className="bar-fill" />
              </div>
              <div className="bar-thumb" />
            </div>
            <time className="t-dur">{fmt(duration)}</time>
          </div>
        </div>

        <div className="viz" id="viz" ref={vizContainerRef} aria-hidden="true">
          {Array.from({ length: 36 }).map((_, i) => (
            <i key={i} />
          ))}
        </div>
      </footer>
    </section>
  );
}
