import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './SvgIcons.jsx';
import { art } from '../data/catalog.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export function Topbar({
  onNavigate,
  canGoBack,
  canGoFwd,
  onBack,
  onFwd,
  stickyTitle,
  stickyCtx,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onShowToast,
}) {
  const { isPlaying, togglePlay, currentContext } = usePlayer();
  const { settings } = useSettings();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Debounce search suggestions fetch from backend
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const list = await res.json();
          setSuggestions(Array.isArray(list) ? list : []);
        }
      } catch (_) {}
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClear = () => {
    onSearchChange('');
    setSuggestions([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSelectSuggestion = item => {
    onSearchChange(item);
    setShowSuggestions(false);
    onSearchSubmit(item);
  };

  return (
    <header className="topbar" id="topbar">
      <div className="topbar-bg" />

      <div className="tb-arrows">
        <button
          className="tb-btn"
          id="back"
          aria-label="Go back"
          disabled={!canGoBack}
          onClick={onBack}
        >
          <Icon name="chev-left" className="i-20" />
        </button>
        <button
          className="tb-btn"
          id="fwd"
          aria-label="Go forward"
          disabled={!canGoFwd}
          onClick={onFwd}
        >
          <Icon name="chev-right" className="i-20" />
        </button>
      </div>

      <button
        className="tb-brand"
        onClick={() => onNavigate('home')}
        aria-label="Redline home"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#C92000" />
          <path
            d="M5 17h5l2.5-6 4 11 3-8 2 3H27"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Redline
      </button>

      {stickyTitle && (
        <div className="tb-sticky">
          <button
            className={`play-btn sm pp ${isPlaying && currentContext === stickyCtx ? 'is-playing' : ''}`}
            id="tbPlay"
            onClick={togglePlay}
            aria-label="Play"
          >
            <Icon name="play" className="ic-play" />
            <Icon name="pause" className="ic-pause" />
          </button>
          <span className="tb-title" id="tbTitle">
            {stickyTitle}
          </span>
        </div>
      )}

      <div className={`search ${searchQuery ? 'has-q' : ''}`} id="searchBox">
        <button
          type="button"
          aria-label="Submit search"
          style={{ background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => {
            if (searchQuery && searchQuery.trim()) {
              setShowSuggestions(false);
              onSearchSubmit(searchQuery);
            }
          }}
        >
          <Icon name="search" className="s-ic" />
        </button>
        <input
          ref={searchInputRef}
          id="q"
          type="search"
          placeholder="What do you want to play?"
          autoComplete="off"
          spellCheck="false"
          aria-label="Search"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setShowSuggestions(false);
              onSearchSubmit(searchQuery);
            }
          }}
        />
        <button
          className="search-clear"
          id="qClear"
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
        >
          <Icon name="close" className="i-16" />
        </button>

        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-box">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                className="suggestion-item"
                onMouseDown={() => handleSelectSuggestion(s)}
              >
                <Icon name="search" className="i-16" />
                <span>{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tb-right">
        <button
          className="tb-btn"
          id="bell"
          aria-label="What's new"
          title="What's new"
          onClick={() => onShowToast('You are all caught up!')}
        >
          <Icon name="bell" className="i-16" />
        </button>
        <button
          className="avatar"
          id="meBtn"
          aria-label="Settings & Profile"
          title={`Profile: ${settings.username}`}
          onClick={() => onNavigate('settings')}
        >
          <img id="me" src={art.me()} alt="" />
        </button>
      </div>
    </header>
  );
}
