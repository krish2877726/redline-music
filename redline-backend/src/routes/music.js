import { Router } from 'express';
import { getTrendingMusic, getRelatedTracks, getExploreShelves, getArtistDetails, getAlbumDetails } from '../services/innertube.js';

const router = Router();

// GET /api/music/trending
router.get('/trending', async (req, res) => {
  try {
    const data = await getTrendingMusic();
    res.json(data);
  } catch (err) {
    console.error('[Route /api/music/trending] Error:', err);
    res.status(500).json({ error: 'Failed to fetch trending tracks' });
  }
});

// GET /api/music/explore
router.get('/explore', async (req, res) => {
  try {
    const data = await getExploreShelves();
    res.json(data);
  } catch (err) {
    console.error('[Route /api/music/explore] Error:', err);
    res.status(500).json({ error: 'Failed to fetch explore shelves' });
  }
});

// GET /api/music/related/:videoId?title=...&artist=...
router.get('/related/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, artist } = req.query;
    const tracks = await getRelatedTracks(videoId, title, artist);
    res.json(tracks);
  } catch (err) {
    console.error('[Route /api/music/related] Error:', err);
    res.status(500).json({ error: 'Failed to fetch related tracks' });
  }
});

// GET /api/music/artist/:id
router.get('/artist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getArtistDetails(id);
    if (!data) return res.status(404).json({ error: 'Artist not found' });
    res.json(data);
  } catch (err) {
    console.error(`[Route /api/music/artist/${req.params.id}] Error:`, err);
    res.status(500).json({ error: 'Failed to fetch artist details' });
  }
});

// GET /api/music/album/:id
router.get('/album/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getAlbumDetails(id);
    if (!data) return res.status(404).json({ error: 'Album not found' });
    res.json(data);
  } catch (err) {
    console.error(`[Route /api/music/album/${req.params.id}] Error:`, err);
    res.status(500).json({ error: 'Failed to fetch album details' });
  }
});

export default router;
