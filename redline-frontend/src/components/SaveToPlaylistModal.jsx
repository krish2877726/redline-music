import React, { useState } from 'react';
import { Icon } from './SvgIcons.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getOptimizedThumbnail } from '../utils/thumbnailUtils.js';

export function SaveToPlaylistModal({ track, isOpen, onClose, onShowToast }) {
  if (!isOpen || !track) return null;

  const {
    customPlaylists,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlayer();

  const { settings } = useSettings();

  const [search, setSearch] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const filteredPlaylists = customPlaylists.filter(pl =>
    pl.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newPl = createPlaylist(newTitle.trim());
    addTrackToPlaylist(newPl.id, track);
    setNewTitle('');
    setShowCreateInput(false);
    onShowToast(`Created playlist "${newPl.title}" and added song`);
  };

  const handleToggle = pl => {
    const isMember = pl.tracks?.some(t => (t.id || t) === (track.id || track));
    if (isMember) {
      removeTrackFromPlaylist(pl.id, track.id || track);
      onShowToast(`Removed from "${pl.title}"`);
    } else {
      addTrackToPlaylist(pl.id, track);
      onShowToast(`Added to "${pl.title}"`);
    }
  };

  const thumb = getOptimizedThumbnail(track.thumbnail, settings);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{
          maxWidth: '460px',
          width: '95%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          borderRadius: '16px',
          background: 'var(--surface)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with track preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img
            src={thumb}
            alt=""
            style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', fontWeight: 700 }}>
              Add to Playlist
            </span>
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

        {/* Create new playlist button / input */}
        {showCreateInput ? (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              className="settings-select"
              style={{ flex: 1, padding: '8px 12px' }}
              placeholder="Playlist name..."
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button className="btn btn-accent" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={handleCreate}>
              Save
            </button>
            <button className="btn btn-outline" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={() => setShowCreateInput(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '14px', padding: '10px', gap: '8px' }}
            onClick={() => setShowCreateInput(true)}
          >
            <Icon name="plus" className="i-16" />
            <span>Create New Playlist</span>
          </button>
        )}

        {/* Playlist Search Filter */}
        {customPlaylists.length > 4 && (
          <div className="stb-search-wrap" style={{ marginBottom: '12px' }}>
            <input
              type="text"
              className="stb-search-input"
              placeholder="Find a playlist..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Playlists List */}
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filteredPlaylists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--muted)', fontSize: '14px' }}>
              {customPlaylists.length === 0
                ? 'No custom playlists yet. Click "Create New Playlist" above!'
                : 'No matching playlists found.'}
            </div>
          ) : (
            filteredPlaylists.map(pl => {
              const isMember = pl.tracks?.some(t => (t.id || t) === (track.id || track));
              return (
                <div
                  key={pl.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isMember ? 'rgba(29,185,84,0.1)' : 'var(--surface-2)',
                    transition: 'background .15s',
                  }}
                  onClick={() => handleToggle(pl)}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{pl.title}</div>
                    <div style={{ fontSize: '12px', color: '#a7a7a7', marginTop: '2px' }}>
                      {pl.tracks?.length || 0} songs
                    </div>
                  </div>

                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: isMember ? '2px solid #1DB954' : '2px solid #777',
                      background: isMember ? '#1DB954' : 'none',
                      color: '#121212',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    {isMember && '✓'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-outline" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
