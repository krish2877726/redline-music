# 🎵 Redline Web App (v2.0)

A high-performance music streaming web application built with **React**, **Vite**, and a lightweight **Node.js Express** backend. Redline combines the dark, content-first visual identity and generative SVG artwork of the original Redline player prototype with the rich UX architecture of **Snitify** (open-source YouTube Music client).

---

## ✨ Key Features & UX Improvements (Inspired by Snitify)

### 1. 🏠 Homepage UX
- **Filter Chips**: Filter shelves instantly by *All*, *Music*, *Mixes*, *Artists*, or *Trending*.
- **Quick Picks / Shortcuts Grid**: 6-tile quick-launch grid with live playing equalizer indicator and instant playback.
- **Hero Carousel**: Auto-advancing album highlights with vinyl disc animation, ambient blur backdrop, pause on hover/focus, and smooth slide controls.
- **"Jump Back In" Shelf**: Remembers your recently listened tracks and albums across sessions.
- **Trending Global Hits**: Real-time trending tracks fetched directly from YouTube Music.
- **Made for You & Moods**: Preserved Daily Mixes, Redline Radar, and genre shelves.

### 2. ⚙️ Comprehensive Settings Screen (Snitify-Themed UX)
- **Account & Profile**: Customize listener display name and profile bio; view library statistics (liked songs, saved albums, playlists).
- **Media Quality & Audio**:
  - **Streaming Audio Quality**: Choose between *Automatic*, *Low (48–64 kbps Data Saver)*, *Normal (128 kbps)*, *High (160 kbps)*, or *Very High (256–320 kbps)*.
  - **Autoplay Similar Tracks**: Continuously fetches and queues related tracks when your current queue finishes.
  - **Volume Normalization**: Built-in Web Audio dynamic compressor ensuring balanced volume across quiet and loud recordings.
  - **5-Band Web Audio Equalizer**: Real-time frequency sculpting (60 Hz, 230 Hz, 910 Hz, 3.6 kHz, 14 kHz) with presets (*Flat*, *Bass Boost*, *Treble Boost*, *Vocal*, *Rock*, *Electronic*) and manual sliders.
- **Content & Display**:
  - **Live Synchronized Lyrics**: Toggle real-time lyrics tracking.
  - **Explicit Content Badge**: Display explicit 'E' badge on explicit tracks.
  - **Rotating Vinyl Animation**: Toggle spinning vinyl disc in full-screen and hero players.
- **Data Saving & Offline Storage**:
  - **Data Saver Mode**: Forces lower bitrates to conserve mobile or metered bandwidth.
  - **Audio Cache Manager**: Displays calculated temporary storage size and offers one-click cache clearing.
- **Backup & Restore**:
  - **Export JSON**: Download a complete backup of your liked songs, custom playlists, and settings.
  - **Import JSON**: Restore your entire library and preferences from any Redline backup file.
  - **Reset Defaults**: Restore audio and display preferences to initial defaults.

### 3. 🎧 Playback Engine & Full-Screen Player
- **Direct Music Streaming**: High-efficiency Node.js proxy with full `Accept-Ranges: bytes` (206 Partial Content) support for smooth seeking and buffering.
- **Real-Time Visualizer**: 36 animated audio visualizer bars (`#viz`) connected to a Web Audio API `AnalyserNode`.
- **Synchronized LRC Lyrics**: Powered by LRCLIB and YouTube Music transcripts, featuring auto-scrolling and click-to-seek functionality.
- **Now Playing Side Panel**: Displays album artwork, artist biography, monthly listeners, and next in queue.
- **Responsive Mobile Layout**: Floating mini-player bar, bottom tab bar, and swipe-down-to-dismiss gesture on mobile.
- **Keyboard Shortcuts**:
  - `Space`: Play / Pause
  - `ArrowRight` / `ArrowLeft`: Seek ±5 seconds (or with `Shift` for Next / Previous)
  - `L`: Like current song
  - `F`: Toggle full-screen player
  - `/`: Focus search input
  - `Escape`: Close full-screen player or menus

---

## 🛠️ Project Structure

```
Redilne/
├── package.json               # Top-level workspace scripts
├── redline-backend/           # Lightweight Node.js Express backend
│   ├── src/
│   │   ├── server.js          # Express app, static SPA serving, security headers
│   │   ├── services/
│   │   │   ├── innertube.js   # YouTube Music search, suggestions, and trending
│   │   │   ├── streamService.js # Direct stream extraction and range audio proxy
│   │   │   └── lyricsService.js # Synced LRC lyrics parsing & LRCLIB integration
│   │   ├── routes/            # /api/search, /api/stream, /api/music, /api/lyrics
│   │   └── utils/cache.js     # In-memory TTL cache
│   └── package.json
├── redline-frontend/          # High-performance React + Vite app
│   ├── index.html             # HTML shell with Google Fonts & favicon
│   ├── vite.config.js         # Vite configuration with API proxy
│   ├── src/
│   │   ├── main.jsx           # React root with Context Providers
│   │   ├── App.jsx            # App shell, routing, keyboard shortcuts
│   │   ├── context/           # PlayerContext (Web Audio Engine) & SettingsContext
│   │   ├── components/        # SvgIcons, Sidebar, Topbar, PlayerBar, FullScreenPlayer, NowPlayingPanel
│   │   ├── views/             # HomeView, SearchView, AlbumView, ArtistView, PlaylistView, LibraryView, SettingsView
│   │   ├── data/catalog.js    # Original generative SVG artwork & fictional catalog
│   │   └── styles/main.css    # Original CSS tokens, layout, animations & settings styles
│   └── package.json
└── snitify/                   # Cloned open-source reference repository
```

---

## 🚀 Getting Started

### 1. Run the Unified Production Server (Single Port 5000)
Both the backend API and the compiled React web application are served together:
```bash
# From the root directory:
npm run start
```
Open **`http://localhost:5000`** in your browser.

---

### 2. Run in Development Mode with Hot Module Replacement (HMR)

**Terminal 1 (Backend API on port 5000):**
```bash
cd redline-backend
npm run dev
```

**Terminal 2 (Frontend React Vite on port 3000):**
```bash
cd redline-frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser. All API calls to `/api/*` are automatically proxied to the backend.

---

### 3. Build Frontend
```bash
cd redline-frontend
npm run build
```
Generates an optimized static bundle in `redline-frontend/dist`.
