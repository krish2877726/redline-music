import React from 'react';
import { Icon } from './SvgIcons.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';

export function TrackOptionsMenu({
  track,
  isOpen,
  onClose,
  onOpenSaveToPlaylist,
  onRemoveFromPlaylist,
  onNavigate,
  onShowToast,
}) {
  if (!isOpen || !track) return null;

  const {
    playNext,
    addToQueue,
    likedTracks,
    toggleLike,
  } = usePlayer();

  const { settings } = useSettings();
  const isLiked = likedTracks.has(track.id);
  const thumb = getOptimizedThumbnail(track.thumbnail, settings);

  const handleCopyLink = () => {
    const url = `https://music.youtube.com/watch?v=${track.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        onShowToast('Link copied to clipboard');
      }).catch(() => {
        onShowToast('Track URL: ' + url);
      });
    } else {
      onShowToast('Track URL: ' + url);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{
          maxWidth: '420px',
          width: '95%',
          padding: '20px',
          borderRadius: '16px',
          background: 'var(--surface)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Track preview header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img
            src={thumb}
            alt=""
            style={{ width: '56px', height: '56px', borderRadius: '6px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {track.title}
            </div>
            <div style={{ fontSize: '13px', color: '#a7a7a7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {track.artist}
            </div>
          </div>
          <button className="stb-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" className="i-16" />
          </button>
        </div>

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* 1. Add / Remove Liked Songs (Spotify Purple Gradient Heart) */}
          <div
            className="spotify-row action-row"
            onClick={() => {
              toggleLike(track.id);
              onShowToast(isLiked ? 'Removed from Liked Songs' : 'Saved to Liked Songs');
              onClose();
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #450AF5, #8E44AD, #C39BD3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={isLiked ? 'heart-fill' : 'heart'}
                  className="i-16"
                  style={{ color: '#fff' }}
                />
              </div>
              <span className="spotify-row-title">
                {isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
              </span>
            </div>
          </div>

          {/* 2. Add to Playlist */}
          <div
            className="spotify-row action-row"
            onClick={() => {
              onClose();
              if (onOpenSaveToPlaylist) onOpenSaveToPlaylist(track);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#2E2E2E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="plus" className="i-16" style={{ color: '#fff' }} />
              </div>
              <span className="spotify-row-title">Add to playlist</span>
            </div>
          </div>

          {/* 3. Remove from Playlist (conditional) */}
          {onRemoveFromPlaylist && (
            <div
              className="spotify-row action-row"
              onClick={() => {
                onRemoveFromPlaylist();
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(255,82,82,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="close" className="i-16" style={{ color: '#ff5252' }} />
                </div>
                <span className="spotify-row-title" style={{ color: '#ff5252' }}>
                  Remove from this playlist
                </span>
              </div>
            </div>
          )}

          {/* 4. Play Next */}
          <div
            className="spotify-row action-row"
            onClick={() => {
              playNext(track);
              onShowToast('Playing next');
              onClose();
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Icon name="play" className="i-20" style={{ color: '#fff' }} />
              <span className="spotify-row-title">Play next</span>
            </div>
          </div>

          {/* 5. Add to Queue */}
          <div
            className="spotify-row action-row"
            onClick={() => {
              addToQueue(track);
              onShowToast('Added to queue');
              onClose();
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Icon name="queue" className="i-20" style={{ color: '#fff' }} />
              <span className="spotify-row-title">Add to queue</span>
            </div>
          </div>

          {/* 6. Go to Artist */}
          {track.artist && onNavigate && (
            <div
              className="spotify-row action-row"
              onClick={() => {
                onClose();
                onNavigate('search');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Icon name="user" className="i-20" style={{ color: '#fff' }} />
                <span className="spotify-row-title">Go to artist</span>
              </div>
            </div>
          )}

          {/* 7. Share / Copy Link */}
          <div className="spotify-row action-row" onClick={handleCopyLink}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Icon name="share" className="i-20" style={{ color: '#fff' }} />
              <span className="spotify-row-title">Share song link</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
