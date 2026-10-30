import React from 'react';
import { Icon } from './SvgIcons.jsx';

export function PlaylistOptionsMenuModal({
  isOpen,
  onClose,
  playlistTitle,
  playlistCover,
  playlistSubtitle,
  isCustom,
  isLiked,
  onStartRename,
  onDeletePlaylist,
  onShowToast,
}) {
  if (!isOpen) return null;

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        onShowToast('Playlist link copied to clipboard');
      }).catch(() => {
        onShowToast('Playlist link copied');
      });
    } else {
      onShowToast('Playlist link copied');
    }
    onClose();
  };

  const handleDownload = () => {
    onShowToast('Downloading playlist for offline playback...');
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
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '16px',
            paddingBottom: '14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <img
            src={playlistCover}
            alt=""
            style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {playlistTitle}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#a7a7a7',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {playlistSubtitle || (isLiked ? 'Playlist • You' : isCustom ? 'Custom Playlist • You' : 'Public Playlist • Redline')}
            </div>
          </div>
          <button className="stb-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" className="i-16" />
          </button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Edit Details (if custom) */}
          {isCustom && onStartRename && (
            <div
              className="spotify-row action-row"
              onClick={() => {
                onClose();
                onStartRename();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Icon name="edit" className="i-20" style={{ color: '#fff' }} />
                <span className="spotify-row-title">Edit playlist details</span>
              </div>
            </div>
          )}

          {/* Delete Playlist (if custom) */}
          {isCustom && onDeletePlaylist && (
            <div
              className="spotify-row action-row"
              onClick={() => {
                onClose();
                onDeletePlaylist();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Icon name="trash" className="i-20" style={{ color: '#ff5252' }} />
                <span className="spotify-row-title" style={{ color: '#ff5252' }}>
                  Delete playlist
                </span>
              </div>
            </div>
          )}

          {/* Share */}
          <div className="spotify-row action-row" onClick={handleShare}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Icon name="share" className="i-20" style={{ color: '#fff' }} />
              <span className="spotify-row-title">Share playlist</span>
            </div>
          </div>

          {/* Download */}
          <div className="spotify-row action-row" onClick={handleDownload}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Icon name="download" className="i-20" style={{ color: '#fff' }} />
              <span className="spotify-row-title">Download for offline listening</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
