import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import searchRoutes from './routes/search.js';
import streamRoutes from './routes/stream.js';
import musicRoutes from './routes/music.js';
import lyricsRoutes from './routes/lyrics.js';
import { getInnertube } from './services/innertube.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range', 'Authorization'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'],
}));

app.use(express.json());

// Request logging in dev
app.use((req, res, next) => {
  if (req.path.startsWith('/api/stream/')) {
    // Keep stream audio pipe logs quiet
    return next();
  }
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Redline Music Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use('/api/search', searchRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/lyrics', lyricsRoutes);

// Serve built React frontend if dist directory exists
const distPath = path.resolve(__dirname, '../../redline-frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback for HTML5 routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(` 🎵 Redline Audio Backend listening on http://localhost:${PORT}`);
  console.log(` 🚀 Endpoints ready: /api/search, /api/stream, /api/music, /api/lyrics`);
  if (fs.existsSync(distPath)) {
    console.log(` 🌐 Serving compiled React webapp from ${distPath}`);
  }
  console.log(`======================================================\n`);

  // Pre-initialize Innertube in the background
  getInnertube().catch(err => {
    console.warn('[Innertube] Background warm-up notice:', err.message);
  });
});
