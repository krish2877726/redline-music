import React, { useState, useMemo } from 'react';
import { Icon } from './SvgIcons.jsx';
import { GLOBAL_LANGUAGES, POPULAR_ARTISTS_CATALOG, INITIAL_ARTIST_IMAGES_MAP } from '../data/languages.js';

export function OnboardingModal({ isOpen, onClose, onComplete, onNavigate }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(0); // 0=Welcome, 1=Languages, 2=Artists, 3=SettingUp
  const [langSearch, setLangSearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [activeLangFilter, setActiveLangFilter] = useState('For You');

  const [selectedLanguages, setSelectedLanguages] = useState(() => {
    try {
      const s = localStorage.getItem('redline_selected_languages');
      return s ? JSON.parse(s) : ['English', 'Hindi'];
    } catch (_) {
      return ['English', 'Hindi'];
    }
  });

  const [selectedArtists, setSelectedArtists] = useState(() => {
    try {
      const a = localStorage.getItem('redline_selected_artists');
      return a ? JSON.parse(a) : ['Arijit Singh', 'Taylor Swift', 'Coldplay'];
    } catch (_) {
      return ['Arijit Singh', 'Taylor Swift', 'Coldplay'];
    }
  });

  // Toggle Language
  const toggleLanguage = langId => {
    setSelectedLanguages(prev =>
      prev.includes(langId) ? prev.filter(x => x !== langId) : [...prev, langId]
    );
  };

  // Toggle Artist
  const toggleArtist = artistName => {
    setSelectedArtists(prev =>
      prev.includes(artistName) ? prev.filter(x => x !== artistName) : [...prev, artistName]
    );
  };

  // Filtered languages
  const filteredLanguages = useMemo(() => {
    const q = langSearch.trim().toLowerCase();
    if (!q) return GLOBAL_LANGUAGES;
    return GLOBAL_LANGUAGES.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
    );
  }, [langSearch]);

  // Language filter chips for Artist step
  const artistFilterChips = useMemo(() => {
    const list = ['For You'];
    selectedLanguages.forEach(l => {
      if (!list.includes(l)) list.push(l);
    });
    if (!list.includes('English')) list.push('English');
    if (!list.includes('Hindi')) list.push('Hindi');
    return list;
  }, [selectedLanguages]);

  // Filtered artists
  const filteredArtists = useMemo(() => {
    const q = artistSearch.trim().toLowerCase();
    return POPULAR_ARTISTS_CATALOG.filter(a => {
      const matchesSearch = !q || a.name.toLowerCase().includes(q);
      const matchesCategory =
        activeLangFilter === 'For You' ||
        a.category.toLowerCase() === activeLangFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [artistSearch, activeLangFilter]);

  const handleFinish = () => {
    setStep(3); // Setting up experience
    localStorage.setItem('redline_selected_languages', JSON.stringify(selectedLanguages));
    localStorage.setItem('redline_selected_artists', JSON.stringify(selectedArtists));
    localStorage.setItem('redline_onboarded', 'true');

    setTimeout(() => {
      if (onComplete) onComplete({ selectedLanguages, selectedArtists });
      onClose();
    }, 1200);
  };

  const requiredCount = 3;
  const artistsRemaining = Math.max(0, requiredCount - selectedArtists.length);
  const canFinish = selectedArtists.length >= requiredCount;

  return (
    <div
      className="modal-overlay"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
      }}
    >
      <div
        className="modal-box"
        style={{
          maxWidth: '720px',
          width: '95%',
          height: '88vh',
          maxHeight: '740px',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 24px',
          borderRadius: '20px',
          background: '#121212',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Step Indicator Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            minHeight: '36px',
          }}
        >
          {step > 0 && step < 3 ? (
            <button
              className="stb-btn"
              onClick={() => setStep(s => s - 1)}
              aria-label="Back"
              style={{ width: '36px', height: '36px' }}
            >
              <Icon name="chev-left" className="i-20" />
            </button>
          ) : (
            <div style={{ width: '36px' }} />
          )}

          {step < 3 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: i === step ? '24px' : '8px',
                    height: '6px',
                    borderRadius: '3px',
                    background: i === step ? '#1DB954' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </div>
          )}

          <button
            className="stb-btn"
            onClick={onClose}
            aria-label="Close"
            style={{ width: '36px', height: '36px' }}
          >
            <Icon name="close" className="i-16" />
          </button>
        </div>

        {/* ── STEP 0: SPOTIFY WELCOME ── */}
        {step === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 20px',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C92000, #ff4d2e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(201,32,0,0.4)',
                marginBottom: '28px',
              }}
            >
              <Icon name="disc" style={{ width: '48px', height: '48px', color: '#fff' }} />
            </div>

            <h1
              style={{
                fontSize: '34px',
                fontWeight: 800,
                color: '#fff',
                marginBottom: '12px',
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}
            >
              Listening is everything.
            </h1>

            <p
              style={{
                fontSize: '15px',
                color: '#b3b3b3',
                maxWidth: '420px',
                lineHeight: 1.5,
                marginBottom: '36px',
              }}
            >
              Stream millions of high-definition songs, curate custom playlists, and build your personalized music experience.
            </p>

            <button
              className="btn btn-primary"
              style={{
                background: '#1DB954',
                color: '#000',
                fontSize: '16px',
                fontWeight: 800,
                padding: '16px 44px',
                borderRadius: '32px',
                letterSpacing: '0.3px',
                boxShadow: '0 8px 24px rgba(29,185,84,0.35)',
                transition: 'transform 0.15s, background 0.15s',
              }}
              onClick={() => setStep(1)}
            >
              Get Started
            </button>
          </div>
        )}

        {/* ── STEP 1: SPOTIFY LANGUAGE SELECTION ── */}
        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              What languages do you listen to?
            </h2>
            <p style={{ color: '#b3b3b3', fontSize: '14px', margin: '0 0 16px' }}>
              Choose 1 or more languages to customize your music recommendations.
            </p>

            {/* Search Bar */}
            <div className="stb-search-wrap" style={{ marginBottom: '14px' }}>
              <Icon name="search" className="i-16" style={{ color: '#a7a7a7', marginRight: '8px' }} />
              <input
                type="text"
                className="stb-search-input"
                placeholder="Search languages..."
                value={langSearch}
                onChange={e => setLangSearch(e.target.value)}
              />
              {langSearch && (
                <span className="stb-clear-btn" onClick={() => setLangSearch('')}>
                  ×
                </span>
              )}
            </div>

            {/* Language Cards Grid */}
            <div
              className="scroll"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                gap: '12px',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '6px',
                paddingBottom: '16px',
              }}
            >
              {filteredLanguages.map(lang => {
                const isSelected = selectedLanguages.includes(lang.id);
                return (
                  <div
                    key={lang.id}
                    style={{
                      height: '84px',
                      borderRadius: '10px',
                      padding: '14px',
                      background: `linear-gradient(135deg, ${lang.colors[0]}, ${lang.colors[1]})`,
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      boxShadow: isSelected ? '0 0 0 2px #fff, 0 8px 16px rgba(0,0,0,0.4)' : 'none',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    }}
                    onClick={() => toggleLanguage(lang.id)}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                      {lang.name}
                    </span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                      {lang.native}
                    </span>

                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          color: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ fontSize: '14px', color: '#b3b3b3', fontWeight: 600 }}>
                {selectedLanguages.length} selected
              </span>

              <button
                className="btn btn-primary"
                style={{
                  background: selectedLanguages.length > 0 ? '#1DB954' : '#333',
                  color: selectedLanguages.length > 0 ? '#000' : '#888',
                  fontSize: '15px',
                  fontWeight: 800,
                  padding: '12px 32px',
                  borderRadius: '24px',
                  cursor: selectedLanguages.length > 0 ? 'pointer' : 'not-allowed',
                }}
                disabled={selectedLanguages.length === 0}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SPOTIFY ARTIST SELECTION ── */}
        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              Choose 3 or more artists you like.
            </h2>
            <p style={{ color: '#b3b3b3', fontSize: '14px', margin: '0 0 16px' }}>
              The more artists you select, the better your recommendations will be.
            </p>

            {/* Artist Search */}
            <div className="stb-search-wrap" style={{ marginBottom: '12px' }}>
              <Icon name="search" className="i-16" style={{ color: '#a7a7a7', marginRight: '8px' }} />
              <input
                type="text"
                className="stb-search-input"
                placeholder="Search artists..."
                value={artistSearch}
                onChange={e => setArtistSearch(e.target.value)}
              />
              {artistSearch && (
                <span className="stb-clear-btn" onClick={() => setArtistSearch('')}>
                  ×
                </span>
              )}
            </div>

            {/* Language filter pills */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                marginBottom: '14px',
                paddingBottom: '4px',
              }}
            >
              {artistFilterChips.map(chip => (
                <button
                  key={chip}
                  className={`pill ${activeLangFilter === chip ? 'on' : ''}`}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '20px',
                  }}
                  onClick={() => setActiveLangFilter(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Artists Grid */}
            <div
              className="scroll"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                gap: '14px',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '6px',
                paddingBottom: '16px',
              }}
            >
              {filteredArtists.map(artist => {
                const isSelected = selectedArtists.includes(artist.name);
                const imgSrc = artist.image || INITIAL_ARTIST_IMAGES_MAP[artist.name];

                return (
                  <div
                    key={artist.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '12px 6px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(29,185,84,0.12)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1.5px solid #1DB954' : '1.5px solid transparent',
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'transform 0.15s, background 0.15s',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                    }}
                    onClick={() => toggleArtist(artist.name)}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '74px',
                        height: '74px',
                        marginBottom: '10px',
                      }}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={artist.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: '#282828',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#fff',
                          }}
                        >
                          {artist.name.charAt(0)}
                        </div>
                      )}

                      {/* Spotify Selection Check Badge */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#1DB954',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 900,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isSelected ? '#1DB954' : '#fff',
                        lineHeight: 1.3,
                        maxHeight: '34px',
                        overflow: 'hidden',
                      }}
                    >
                      {artist.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#a7a7a7', marginTop: '2px' }}>
                      {artist.category}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ fontSize: '14px', color: canFinish ? '#1DB954' : '#b3b3b3', fontWeight: 700 }}>
                {canFinish ? `Great picks! (${selectedArtists.length} selected)` : `${artistsRemaining} more to choose`}
              </span>

              <button
                className="btn btn-primary"
                style={{
                  background: canFinish ? '#1DB954' : '#333',
                  color: canFinish ? '#000' : '#888',
                  fontSize: '15px',
                  fontWeight: 800,
                  padding: '12px 36px',
                  borderRadius: '24px',
                  cursor: canFinish ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s, transform 0.15s',
                }}
                disabled={!canFinish}
                onClick={handleFinish}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PREPARING YOUR MUSIC ── */}
        {step === 3 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 20px',
            }}
          >
            <div
              className="spinner"
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid rgba(255,255,255,0.1)',
                borderTopColor: '#1DB954',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '24px',
              }}
            />
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Setting up your music...
            </h2>
            <p style={{ color: '#b3b3b3', fontSize: '14px', maxWidth: '360px' }}>
              Personalizing your daily mixes, artist shelves, and audio streams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
