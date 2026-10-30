import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TR, ALB, ART, PL, ALL, art, ctxTracks, clamp, LYRICS } from '../data/catalog.js';
import { useSettings } from './SettingsContext.jsx';

const PlayerContext = createContext(null);

const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];

const filterOutFake = items => {
  if (!items) return [];
  const fakeSet = new Set(['afterglow-district', 'night-bus-hymns', 'paper-moons', 'small-town-static', 'golden-hour-riot', 'lagos-lightning', 'slow-honey', 'fuzz-fluorescence', 'midnight-laundromat', 'rainy-day-ramen', 'ash-season', 'neon-psalms', 'pixel-cathedral', 'glass-weather', 'blue-room', 'saltwater-letters', 'concrete-gardens', 'daily-mix-1', 'daily-mix-2', 'daily-mix-3', 'daily-mix-4', 'redline-radar', 'late-night-drive', 'deep-focus', 'sunday-slowdown', 'hot-hits', 'viral-hits', 'redline-workout', 'nova-vale', 'mira-okafor', 'lowtide-club', 'kairo-sun', 'paper-lanterns', 'static-bloom', 'atlas-ash', 'velvet-arcade', 'juniper-hale', 'teo-marlowe', 'hollow-coast', 'saffron-kade']);
  return items.filter(id => {
    if (typeof id === 'string') {
      if (id.includes('~')) return false;
      if (fakeSet.has(id)) return false;
    }
    return true;
  });
};

export function PlayerProvider({ children }) {
  const { settings } = useSettings();

  // Persistent library collections (Pure real data, no fictional demo tracks)
  const [likedTracks, setLikedTracks] = useState(() => {
    try {
      const s = localStorage.getItem('redline_liked_tracks');
      if (s) return new Set(filterOutFake(JSON.parse(s)));
    } catch (_) {}
    return new Set();
  });

  const [savedAlbums, setSavedAlbums] = useState(() => {
    try {
      const s = localStorage.getItem('redline_saved_albums');
      if (s) return new Set(filterOutFake(JSON.parse(s)));
    } catch (_) {}
    return new Set();
  });

  const [savedPlaylists, setSavedPlaylists] = useState(() => {
    try {
      const s = localStorage.getItem('redline_saved_playlists');
      if (s) return new Set(filterOutFake(JSON.parse(s)));
    } catch (_) {}
    return new Set();
  });

  const [customPlaylists, setCustomPlaylists] = useState(() => {
    try {
      const stored = localStorage.getItem('redline_custom_playlists');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const [followedArtists, setFollowedArtists] = useState(() => {
    try {
      const s = localStorage.getItem('redline_followed_artists');
      if (s) return new Set(filterOutFake(JSON.parse(s)));
    } catch (_) {}
    return new Set();
  });

  // Jump Back In (Snitify UX: recently played items)
  const [recentTracks, setRecentTracks] = useState(() => {
    try {
      const s = localStorage.getItem('redline_recents');
      if (s) return filterOutFake(JSON.parse(s));
    } catch (_) {}
    return [];
  });

  // Player State
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentContext, setCurrentContext] = useState('album:afterglow-district');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(200);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0); // 0=off, 1=all, 2=one
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [lyrics, setLyrics] = useState({ synced: [], plain: '', isSynced: false });
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

  // Audio References
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const compressorNodeRef = useRef(null);
  const eqFiltersRef = useRef([]);
  const synthIntervalRef = useRef(null);
  const isDraggingSeekRef = useRef(false);
  const handleTrackEndRef = useRef(null);

  // Initialize Audio & Web Audio API
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!isDraggingSeekRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      handleTrackEndRef.current?.();
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleError = e => {
      console.warn('[Audio Player] Playback error on audio element:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Web Audio Graph Setup
  const setupWebAudio = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const audio = audioRef.current;
      const source = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = source;

      // Equalizer biquad filters (5 bands)
      const filters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        if (i === 0) {
          filter.type = 'lowshelf';
        } else if (i === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.0;
        }
        filter.frequency.value = freq;
        filter.gain.value = settings.equalizerEnabled ? (settings.equalizerBands[i] || 0) : 0;
        return filter;
      });
      eqFiltersRef.current = filters;

      // Compressor for volume normalization
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);
      compressorNodeRef.current = compressor;

      // Master Gain
      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : volume;
      gainNodeRef.current = gain;

      // Analyser for #viz visualizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserNodeRef.current = analyser;

      // Connect graph: Source -> EQ Filters -> (Compressor if enabled) -> Gain -> Analyser -> Destination
      let lastNode = source;
      for (const filter of filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      if (settings.normalizeVolume) {
        lastNode.connect(compressor);
        compressor.connect(gain);
      } else {
        lastNode.connect(gain);
      }

      gain.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) {
      console.warn('Web Audio API setup notice:', e.message);
    }
  };

  // Update Equalizer nodes when settings change
  useEffect(() => {
    if (!eqFiltersRef.current.length) return;
    eqFiltersRef.current.forEach((filter, i) => {
      const gainVal = settings.equalizerEnabled ? (settings.equalizerBands[i] || 0) : 0;
      if (audioContextRef.current) {
        filter.gain.setTargetAtTime(gainVal, audioContextRef.current.currentTime, 0.05);
      } else {
        filter.gain.value = gainVal;
      }
    });
  }, [settings.equalizerEnabled, settings.equalizerBands]);

  // Update Volume / Mute
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
    }
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(effectiveVol, audioContextRef.current.currentTime, 0.02);
    }
  }, [volume, isMuted]);

  // Persist Library Collections
  useEffect(() => {
    localStorage.setItem('redline_liked_tracks', JSON.stringify([...likedTracks]));
  }, [likedTracks]);

  useEffect(() => {
    localStorage.setItem('redline_saved_albums', JSON.stringify([...savedAlbums]));
  }, [savedAlbums]);

  useEffect(() => {
    localStorage.setItem('redline_saved_playlists', JSON.stringify([...savedPlaylists]));
  }, [savedPlaylists]);

  useEffect(() => {
    localStorage.setItem('redline_custom_playlists', JSON.stringify(customPlaylists));
  }, [customPlaylists]);

  useEffect(() => {
    localStorage.setItem('redline_followed_artists', JSON.stringify([...followedArtists]));
  }, [followedArtists]);

  useEffect(() => {
    localStorage.setItem('redline_recents', JSON.stringify(recentTracks.slice(0, 30)));
  }, [recentTracks]);

  // Resolve current track object
  const currentTrackId = queue[queueIndex] || null;

  const getCurrentTrackObject = () => {
    if (!currentTrackId) return null;
    if (typeof currentTrackId === 'object') {
      return currentTrackId;
    }
    if (TR[currentTrackId]) {
      const t = TR[currentTrackId];
      const a = ALB[t.album];
      const ar = ART[t.artist];
      return {
        id: t.id,
        title: t.title,
        artist: ar ? ar.name : 'Unknown Artist',
        artistId: ar ? ar.id : '',
        album: a ? a.title : '',
        albumId: a ? a.id : '',
        duration: t.dur || 0,
        thumbnail: a ? art.album(a) : art.liked(),
        explicit: t.explicit,
        isOnline: false,
      };
    }
    return {
      id: currentTrackId,
      title: 'Track',
      artist: 'Unknown Artist',
      duration: 180,
      thumbnail: '',
      isOnline: true,
    };
  };

  const currentTrack = getCurrentTrackObject();

  // Load and play track
  const loadAndPlay = async (trackObj, shouldPlay = true) => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }

    setupWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const trackId = typeof trackObj === 'object' ? trackObj.id : trackObj;
    const isYt = (typeof trackObj === 'object' && (trackObj.source === 'ytmusic' || trackObj.id?.length === 11)) ||
      (typeof trackId === 'string' && (trackId.startsWith('yt:') || trackId.length === 11 || (!trackId.includes('~') && !TR[trackId])));

    // Record in Recents / Jump back in
    setRecentTracks(prev => [trackId, ...prev.filter(x => (typeof x === 'object' ? x.id : x) !== trackId)].slice(0, 30));

    // Update Lyrics
    fetchLyrics(trackObj);

    if (trackId) {
      const ytId = typeof trackObj === 'object' ? trackObj.id : (typeof trackId === 'string' ? trackId.replace('yt:', '') : trackId);
      const streamUrl = `/api/stream/${ytId}?quality=${settings.dataSaver ? 'low' : settings.audioQuality}`;
      if (audioRef.current) {
        audioRef.current.src = streamUrl;
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        if (trackObj.duration) setDuration(trackObj.duration);

        if (shouldPlay) {
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (err) {
            console.warn('[Audio Player] Play error:', err);
          }
        }
      }
    }
  };

  // Lyrics Fetcher
  const fetchLyrics = async trackObj => {
    const title = trackObj.title || (TR[trackObj.id] ? TR[trackObj.id].title : '');
    const artist = trackObj.artist || (TR[trackObj.id] ? ART[TR[trackObj.id].artist].name : '');
    const dur = trackObj.duration || (TR[trackObj.id] ? TR[trackObj.id].dur : 180);

    // If local fictional album track
    if (TR[trackObj.id]) {
      const a = ALB[TR[trackObj.id].album];
      if (a && a.lyr != null && LYRICS[a.lyr]) {
        const lines = LYRICS[a.lyr];
        const step = (dur - 20) / lines.length;
        const synced = lines.map((text, i) => ({
          time: 8 + i * step,
          text,
        }));
        setLyrics({ synced, plain: lines.join('\n'), isSynced: true });
        return;
      }
    }

    // Fetch from backend
    try {
      const res = await fetch(`/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&duration=${dur}`);
      if (res.ok) {
        const data = await res.json();
        setLyrics(data);
      } else {
        setLyrics({ synced: [], plain: 'Instrumental. Just vibes.', isSynced: false });
      }
    } catch (_) {
      setLyrics({ synced: [], plain: 'Lyrics currently unavailable.', isSynced: false });
    }
  };

  // Sync lyrics line with currentTime
  useEffect(() => {
    if (!lyrics.synced || !lyrics.synced.length) {
      setActiveLyricIndex(-1);
      return;
    }
    let idx = -1;
    for (let i = 0; i < lyrics.synced.length; i++) {
      if (currentTime >= lyrics.synced[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    setActiveLyricIndex(idx);
  }, [currentTime, lyrics]);

  // Handle Track Completion
  const handleTrackEnd = () => {
    if (repeat === 2) {
      // Repeat one
      seekTo(0);
      if (audioRef.current) audioRef.current.play();
      return;
    }
    if (shuffle && queue.length > 1) {
      let nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === queueIndex);
      setQueueIndex(nextIdx);
      loadAndPlay(queue[nextIdx], true);
      return;
    }
    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      loadAndPlay(queue[nextIdx], true);
    } else if (repeat === 1) {
      // Repeat all
      setQueueIndex(0);
      loadAndPlay(queue[0], true);
    } else {
      // Autoplay: fetch related tracks if enabled
      if (settings.autoplay && currentTrack) {
        fetchAutoplayTracks();
      } else {
        setIsPlaying(false);
      }
    }
  };

  handleTrackEndRef.current = handleTrackEnd;

  // Autoplay similar songs (Snitify UX)
  const fetchAutoplayTracks = async () => {
    try {
      const res = await fetch(`/api/music/related/${currentTrack.id || 'radio'}?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`);
      if (res.ok) {
        const related = await res.json();
        if (Array.isArray(related) && related.length > 0) {
          setQueue(prev => [...prev, ...related]);
          setQueueIndex(prev => prev + 1);
          loadAndPlay(related[0], true);
          return;
        }
      }
    } catch (e) {
      console.warn('Autoplay error:', e);
    }
    setIsPlaying(false);
  };

  // Player Controls
  const togglePlay = () => {
    if (!currentTrack) {
      if (queue.length > 0) {
        loadAndPlay(queue[0], true);
      }
      return;
    }
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setupWebAudio();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.warn('[Audio Player] Resume play error, reloading track:', err);
            loadAndPlay(currentTrack, true);
          });
      } else {
        loadAndPlay(currentTrack, true);
      }
    }
  };

  const playTrack = (track, ctx = '', index = 0, trackList = null) => {
    setCurrentContext(ctx || 'single');
    if (trackList && Array.isArray(trackList) && trackList.length > 0) {
      setQueue(trackList);
      setQueueIndex(clamp(index, 0, trackList.length - 1));
      loadAndPlay(trackList[index], true);
      return;
    }
    if (ctx) {
      const tracks = ctxTracks(ctx, likedTracks);
      if (tracks.length > 0) {
        setQueue(tracks);
        setQueueIndex(clamp(index, 0, tracks.length - 1));
        loadAndPlay(tracks[index], true);
        return;
      }
    }
    setQueue([track]);
    setQueueIndex(0);
    loadAndPlay(track, true);
  };

  const playNext = track => {
    setQueue(prev => {
      const copy = [...prev];
      copy.splice(queueIndex + 1, 0, track);
      return copy;
    });
  };

  const createPlaylist = name => {
    const id = 'pl_' + Date.now();
    const newPl = {
      id,
      title: name || 'My Playlist',
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setCustomPlaylists(prev => [newPl, ...prev]);
    return newPl;
  };

  const addTrackToPlaylist = (playlistId, track) => {
    setCustomPlaylists(prev =>
      prev.map(pl => {
        if (pl.id !== playlistId) return pl;
        if (pl.tracks.some(t => (t.id || t) === (track.id || track))) return pl;
        return { ...pl, tracks: [...pl.tracks, track] };
      })
    );
  };

  const removeTrackFromPlaylist = (playlistId, trackId) => {
    setCustomPlaylists(prev =>
      prev.map(pl => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          tracks: pl.tracks.filter(t => (t.id || t) !== trackId),
        };
      })
    );
  };

  const deletePlaylist = playlistId => {
    setCustomPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
  };

  const renamePlaylist = (playlistId, newTitle) => {
    setCustomPlaylists(prev =>
      prev.map(pl => (pl.id === playlistId ? { ...pl, title: newTitle } : pl))
    );
  };

  const playContext = (ctx, startIdx = 0) => {
    let tracks = [];
    if (ctx.startsWith('playlist:pl_')) {
      const plId = ctx.replace('playlist:', '');
      const custom = customPlaylists.find(p => p.id === plId);
      if (custom) tracks = custom.tracks || [];
    } else {
      tracks = ctxTracks(ctx, likedTracks);
    }
    if (!tracks.length) return;
    setCurrentContext(ctx);
    setQueue(tracks);
    setQueueIndex(clamp(startIdx, 0, tracks.length - 1));
    loadAndPlay(tracks[startIdx], true);
  };

  const next = () => {
    if (!queue.length) return;
    let nextIdx = (queueIndex + 1) % queue.length;
    if (shuffle && queue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === queueIndex);
    }
    setQueueIndex(nextIdx);
    loadAndPlay(queue[nextIdx], true);
  };

  const prev = () => {
    if (!queue.length) return;
    if (currentTime > 3) {
      seekTo(0);
      return;
    }
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    loadAndPlay(queue[prevIdx], true);
  };

  const seekTo = seconds => {
    const s = clamp(seconds, 0, duration - 0.5);
    setCurrentTime(s);
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      audioRef.current.currentTime = s;
    }
  };

  const setVolume = val => {
    const v = clamp(val, 0, 1);
    setVolumeState(v);
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const toggleShuffle = () => {
    setShuffle(prev => !prev);
  };

  const toggleRepeat = () => {
    setRepeat(prev => (prev + 1) % 3);
  };

  const addToQueue = items => {
    if (!Array.isArray(items)) items = [items];
    setQueue(prev => [...prev.slice(0, queueIndex + 1), ...items, ...prev.slice(queueIndex + 1)]);
  };

  // Library Toggle Handlers
  const toggleLike = id => {
    setLikedTracks(prev => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  };

  const toggleSaveAlbum = id => {
    setSavedAlbums(prev => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  };

  const toggleSavePlaylist = id => {
    setSavedPlaylists(prev => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  };

  const toggleFollowArtist = id => {
    setFollowedArtists(prev => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  };

  return (
    <PlayerContext.Provider
      value={{
        queue,
        queueIndex,
        currentTrack,
        currentContext,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        shuffle,
        repeat,
        fullscreenOpen,
        setFullscreenOpen,
        lyrics,
        activeLyricIndex,
        likedTracks,
        savedAlbums,
        savedPlaylists,
        customPlaylists,
        followedArtists,
        recentTracks,
        analyserNode: analyserNodeRef.current,
        isDraggingSeekRef,

        // Actions
        playTrack,
        playNext,
        addToQueue,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        playContext,
        togglePlay,
        next,
        prev,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleLike,
        toggleSaveAlbum,
        toggleSavePlaylist,
        toggleFollowArtist,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}
