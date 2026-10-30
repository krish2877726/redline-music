import React from 'react';
import { Icon } from '../../../components/SvgIcons.jsx';

/**
 * Top bar matching Snitify's SpotifyTopBar
 * - Back button on left
 * - Centered bold title
 * - Optional action/search on right
 */
export function SpotifyTopBar({ title, onBack, onSearchClick, searchActive, searchQuery, onSearchChange, onSearchClose }) {
  if (searchActive) {
    return (
      <div className="spotify-topbar search-active">
        <button className="stb-btn" onClick={onSearchClose} aria-label="Back">
          <Icon name="chev-left" className="i-20" />
        </button>
        <div className="stb-search-wrap">
          <input
            type="text"
            className="stb-search-input"
            placeholder="Search settings"
            value={searchQuery}
            autoFocus
            onChange={e => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="stb-clear-btn" onClick={() => onSearchChange('')} aria-label="Clear search">
              <Icon name="close" className="i-16" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-topbar">
      <button className="stb-btn" onClick={onBack} aria-label="Back">
        <Icon name="chev-left" className="i-20" />
      </button>
      <span className="stb-title">{title}</span>
      {onSearchClick ? (
        <button className="stb-btn stb-right" onClick={onSearchClick} aria-label="Search settings">
          <Icon name="search" className="i-20" />
        </button>
      ) : (
        <div className="stb-placeholder" />
      )}
    </div>
  );
}

/**
 * Section Header matching Snitify's SpotifySectionHeader
 */
export function SpotifySectionHeader({ title }) {
  return <div className="spotify-section-header">{title}</div>;
}

/**
 * Animated Spotify Switch
 */
export function SpotifySwitch({ checked, onChange }) {
  return (
    <div
      className={`spotify-switch ${checked ? 'checked' : ''}`}
      onClick={e => {
        e.stopPropagation();
        onChange(!checked);
      }}
      role="switch"
      aria-checked={checked}
    >
      <div className="spotify-switch-thumb" />
    </div>
  );
}

/**
 * Setting Toggle Row matching Snitify's SpotifySettingToggleRow
 */
export function SpotifySettingToggleRow({ title, subtitle, checked, onChange }) {
  return (
    <div className="spotify-row toggle-row" onClick={() => onChange(!checked)}>
      <div className="spotify-row-text">
        <span className="spotify-row-title">{title}</span>
        {subtitle && <span className="spotify-row-sub">{subtitle}</span>}
      </div>
      <SpotifySwitch checked={checked} onChange={onChange} />
    </div>
  );
}

/**
 * Setting Action Row matching Snitify's SpotifySettingActionRow
 */
export function SpotifySettingActionRow({ title, subtitle, trailingText, onClick }) {
  return (
    <div className="spotify-row action-row" onClick={onClick}>
      <div className="spotify-row-text">
        <span className="spotify-row-title">{title}</span>
        {subtitle && <span className="spotify-row-sub">{subtitle}</span>}
      </div>
      <div className="spotify-row-end">
        {trailingText && <span className="spotify-trailing-text">{trailingText}</span>}
        <Icon name="chev-right" className="i-16 spotify-chevron" />
      </div>
    </div>
  );
}

/**
 * Radio Dialog matching Snitify's selection modals
 */
export function SpotifyRadioDialog({ title, options, selectedKey, onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box spotify-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className="spotify-dialog-options">
          {options.map(opt => {
            const isSelected = selectedKey === opt.key;
            return (
              <div
                key={opt.key}
                className={`spotify-dialog-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(opt.key)}
              >
                <div className="sdi-text">
                  <span className="sdi-label">{opt.label}</span>
                  {opt.sub && <span className="sdi-sub">{opt.sub}</span>}
                </div>
                <div className={`spotify-radio-circle ${isSelected ? 'selected' : ''}`}>
                  {isSelected && <div className="spotify-radio-inner" />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
