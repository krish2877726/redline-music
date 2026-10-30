import { Router } from 'express';
import { searchMusic, getSearchSuggestions } from '../services/innertube.js';

const router = Router();

// GET /api/search?q=query&type=all|songs|artists|albums|playlists
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q || !q.trim()) {
      return res.json({ songs: [], artists: [], albums: [], playlists: [] });
    }

    const results = await searchMusic(q, type);
    res.json(results);
  } catch (err) {
    console.error('[Route /api/search] Error:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// GET /api/suggestions?q=query
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const suggestions = await getSearchSuggestions(q);
    res.json(suggestions);
  } catch (err) {
    console.error('[Route /api/suggestions] Error:', err);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
