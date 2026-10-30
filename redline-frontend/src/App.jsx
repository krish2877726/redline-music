import React, { useState, useEffect, useRef } from 'react';
import { SvgIcons, Icon } from './components/SvgIcons.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Topbar } from './components/Topbar.jsx';
import { PlayerBar } from './components/PlayerBar.jsx';
import { FullScreenPlayer } from './components/FullScreenPlayer.jsx';
import { Toast } from './components/Toast.jsx';
import { OnboardingModal } from './components/OnboardingModal.jsx';

import { HomeView } from './views/HomeView.jsx';
import { SearchView } from './views/SearchView.jsx';
import { AlbumView } from './views/AlbumView.jsx';
import { ArtistView } from './views/ArtistView.jsx';
import { PlaylistView } from './views/PlaylistView.jsx';
import { LibraryView } from './views/LibraryView.jsx';
import { SettingsView } from './views/SettingsView.jsx';

import { usePlayer } from './context/PlayerContext.jsx';
import { ALB, ART, PL } from './data/catalog.js';

export function App() {
  const {
    currentTrack,
    togglePlay,
    next,
    prev,
    seekTo,
    currentTime,
    toggleLike,
    fullscreenOpen,
    setFullscreenOpen,
    customPlaylists,
  } = usePlayer();

  // Onboarding state (Snitify UX)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !localStorage.getItem('redline_onboarded');
    } catch (_) {
      return false;
    }
  });

  // Navigation state & history stack
  const [historyStack, setHistoryStack] = useState([{ view: 'home', id: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [headerColor, setHeaderColor] = useState('#3a3a3a');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  const currentRoute = historyStack[historyIndex] || { view: 'home', id: null };

  const navigate = (view, id = null) => {
    setHistoryStack(prev => {
      const nextStack = prev.slice(0, historyIndex + 1);
      nextStack.push({ view, id });
      return nextStack;
    });
    setHistoryIndex(prev => prev + 1);

    // Reset scroll to top
    const scroller = document.getElementById('scroller');
    if (scroller) scroller.scrollTop = 0;
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  };

  const goForward = () => {
    if (historyIndex < historyStack.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  };

  const showToast = msg => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2400);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = e => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.getAttribute && e.target.getAttribute('role') === 'slider') return;

      if (e.code === 'Space' && tag !== 'BUTTON') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === '/') {
        e.preventDefault();
        navigate('search');
        setTimeout(() => {
          const input = document.getElementById('q');
          if (input) input.focus();
        }, 50);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) next();
        else seekTo(currentTime + 5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) prev();
        else seekTo(currentTime - 5);
      } else if (e.key.toLowerCase() === 'l' && currentTrack) {
        toggleLike(currentTrack.id);
        showToast('Liked tracks updated');
      } else if (e.key.toLowerCase() === 'f') {
        setFullscreenOpen(p => !p);
      } else if (e.key === 'Escape') {
        setFullscreenOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, currentTime, togglePlay, next, prev, seekTo, toggleLike, setFullscreenOpen]);

  // Set document title
  useEffect(() => {
    if (currentTrack) {
      document.title = `${currentTrack.title} • ${currentTrack.artist} — Redline`;
    } else {
      document.title = 'Redline — Music Player';
    }
  }, [currentTrack]);

  // Get sticky title for topbar
  const getStickyInfo = () => {
    if (currentRoute.view === 'album' && ALB[currentRoute.id]) {
      return { title: ALB[currentRoute.id].title, ctx: `album:${currentRoute.id}` };
    }
    if (currentRoute.view === 'artist' && ART[currentRoute.id]) {
      return { title: ART[currentRoute.id].name, ctx: `artist:${currentRoute.id}` };
    }
    if (currentRoute.view === 'playlist') {
      const isLiked = currentRoute.id === 'liked';
      let title = isLiked ? 'Liked Songs' : PL[currentRoute.id]?.title;
      if (!title && currentRoute.id?.startsWith('pl_')) {
        const custom = (customPlaylists || []).find(p => p.id === currentRoute.id);
        title = custom ? custom.title : 'Playlist';
      }
      return {
        title: title || 'Playlist',
        ctx: `playlist:${currentRoute.id}`,
      };
    }
    return { title: '', ctx: '' };
  };

  const stickyInfo = getStickyInfo();

  return (
    <div
      className="app"
      id="app"
      style={{ '--hdr': headerColor }}
    >
      <SvgIcons />

      {/* Sidebar */}
      <Sidebar
        currentView={currentRoute.view}
        onNavigate={navigate}
        onShowToast={showToast}
      />

      {/* Main Content Area */}
      <main className="main" id="main">
        <div className="main-scroll scroll" id="scroller">
          <Topbar
            onNavigate={navigate}
            canGoBack={historyIndex > 0}
            canGoFwd={historyIndex < historyStack.length - 1}
            onBack={goBack}
            onFwd={goForward}
            stickyTitle={stickyInfo.title}
            stickyCtx={stickyInfo.ctx}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={q => {
              const clean = (q || '').trim();
              setSearchQuery(clean);
              setSubmittedQuery(clean);
              if (currentRoute.view !== 'search') navigate('search');
            }}
            onShowToast={showToast}
          />

          <div id="view" className="view enter">
            {currentRoute.view === 'home' && (
              <HomeView
                onNavigate={navigate}
                onSetHdr={setHeaderColor}
                onShowToast={showToast}
                onOpenOnboarding={() => setShowOnboarding(true)}
                onSelectQuery={q => {
                  const clean = (q || '').trim();
                  setSearchQuery(clean);
                  setSubmittedQuery(clean);
                  navigate('search');
                }}
              />
            )}

            {currentRoute.view === 'search' && (
              <SearchView
                query={submittedQuery}
                onSelectQuery={q => {
                  const clean = (q || '').trim();
                  setSearchQuery(clean);
                  setSubmittedQuery(clean);
                }}
                onNavigate={navigate}
                onShowToast={showToast}
              />
            )}

            {currentRoute.view === 'library' && (
              <LibraryView
                onNavigate={navigate}
                onShowToast={showToast}
              />
            )}

            {currentRoute.view === 'album' && (
              <AlbumView
                albumId={currentRoute.id}
                onNavigate={navigate}
                onSetHdr={setHeaderColor}
                onShowToast={showToast}
              />
            )}

            {currentRoute.view === 'artist' && (
              <ArtistView
                artistId={currentRoute.id}
                onNavigate={navigate}
                onSetHdr={setHeaderColor}
                onShowToast={showToast}
              />
            )}

            {currentRoute.view === 'playlist' && (
              <PlaylistView
                playlistId={currentRoute.id}
                onNavigate={navigate}
                onSetHdr={setHeaderColor}
                onShowToast={showToast}
              />
            )}

            {currentRoute.view === 'settings' && (
              <SettingsView
                onShowToast={showToast}
                onNavigate={navigate}
                onOpenOnboarding={() => setShowOnboarding(true)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Bottom Player Bar */}
      <PlayerBar
        onNavigate={navigate}
        onShowToast={showToast}
      />

      {/* Mobile Floating Tabbar */}
      <nav className="tabbar" id="tabbar" aria-label="Tabs">
        <button
          className={currentRoute.view === 'home' ? 'active' : ''}
          onClick={() => navigate('home')}
        >
          <Icon name="home" />
          <Icon name="home-fill" />
          <span>Home</span>
        </button>
        <button
          className={currentRoute.view === 'search' ? 'active' : ''}
          onClick={() => navigate('search')}
        >
          <Icon name="search" />
          <span>Search</span>
        </button>
        <button
          className={currentRoute.view === 'library' ? 'active' : ''}
          onClick={() => navigate('library')}
        >
          <Icon name="library" />
          <span>Your Library</span>
        </button>
        <button
          className={currentRoute.view === 'settings' ? 'active' : ''}
          onClick={() => navigate('settings')}
        >
          <Icon name="settings" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Full-screen Player */}
      <FullScreenPlayer
        onNavigate={navigate}
        onShowToast={showToast}
      />

      {/* Onboarding Modal (Snitify UX) */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          setShowOnboarding(false);
          showToast('Preferences updated!');
        }}
        onNavigate={navigate}
      />

      {/* Toast Notifications */}
      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
