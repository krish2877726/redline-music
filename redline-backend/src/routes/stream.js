import { Router } from 'express';
import { getAudioStreamDetails, pipeAudioStream } from '../services/streamService.js';

const router = Router();

// GET /api/stream/:videoId?quality=high|normal|low
router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const { quality = 'high' } = req.query;

  if (!videoId || videoId.length < 5) {
    return res.status(400).json({ error: 'Valid videoId is required' });
  }

  await pipeAudioStream(videoId, quality, req, res);
});

// GET /api/stream-url/:videoId?quality=high|normal|low
router.get('/url/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const { quality = 'high' } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'Valid videoId is required' });
  }

  try {
    const details = await getAudioStreamDetails(videoId, quality);
    res.json(details);
  } catch (err) {
    console.error(`[Route /api/stream-url] Error for ${videoId}:`, err.message);
    res.status(500).json({ error: err.message || 'Failed to extract stream URL' });
  }
});

export default router;
