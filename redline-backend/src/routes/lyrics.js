import { Router } from 'express';
import { getLyrics } from '../services/lyricsService.js';

const router = Router();

// GET /api/lyrics?title=...&artist=...&duration=...
router.get('/', async (req, res) => {
  try {
    const { title, artist, duration } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Song title is required' });
    }

    const lyrics = await getLyrics(title, artist, duration ? Number(duration) : 0);
    res.json(lyrics);
  } catch (err) {
    console.error('[Route /api/lyrics] Error:', err);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

export default router;
