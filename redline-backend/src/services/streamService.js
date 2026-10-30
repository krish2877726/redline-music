import { Ytdl } from '@distube/ytdl-core';
import { streamCache } from '../utils/cache.js';

const ytdl = new Ytdl();

/**
 * Get direct playable audio URL with bitrate/format details
 */
export async function getAudioStreamDetails(videoId, quality = 'high') {
  if (!videoId) throw new Error('Video ID is required');

  const cacheKey = `stream:${videoId}:${quality}`;
  const cached = streamCache.get(cacheKey);
  if (cached) return cached;

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const info = await ytdl.getInfo(url);
  const audioFormats = info.formats.filter(f => f.hasAudio && !f.hasVideo);

  if (!audioFormats.length) {
    throw new Error('No audio streams found for this track');
  }

  // Sort formats by bitrate
  audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

  let selectedFormat;
  if (quality === 'low') {
    // 48-64 kbps (Data saver)
    selectedFormat = audioFormats.find(f => (f.audioBitrate || 0) <= 70) || audioFormats[audioFormats.length - 1];
  } else if (quality === 'normal') {
    // ~128 kbps
    selectedFormat = audioFormats.find(f => (f.audioBitrate || 0) >= 120 && (f.audioBitrate || 0) <= 140) || audioFormats[Math.floor(audioFormats.length / 2)];
  } else {
    // high or very_high: best audio bitrate
    selectedFormat = audioFormats[0];
  }

  const result = {
    videoId,
    title: info.videoDetails.title,
    duration: Number(info.videoDetails.lengthSeconds),
    url: selectedFormat.url,
    mimeType: selectedFormat.mimeType || 'audio/webm',
    bitrate: selectedFormat.audioBitrate,
    contentLength: selectedFormat.contentLength ? Number(selectedFormat.contentLength) : null,
  };

  // Cache stream URL for 2 hours (Google Video URLs typically valid 6 hrs)
  streamCache.set(cacheKey, result, 2 * 60 * 60 * 1000);
  return result;
}

/**
 * Stream audio chunks directly to client with HTTP Range request support (206 Partial Content)
 */
export async function pipeAudioStream(videoId, quality, req, res) {
  try {
    let details;
    try {
      details = await getAudioStreamDetails(videoId, quality);
    } catch (err) {
      // Clear cache and retry once if needed
      streamCache.delete(`stream:${videoId}:${quality}`);
      details = await getAudioStreamDetails(videoId, quality);
    }

    const headers = {};
    const range = req.headers.range;
    if (range) {
      headers['Range'] = range;
    }

    const upstreamResponse = await fetch(details.url, {
      method: 'GET',
      headers,
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      // Upstream failed (e.g. 403 expired), invalidate cache and retry fresh
      streamCache.delete(`stream:${videoId}:${quality}`);
      const freshDetails = await getAudioStreamDetails(videoId, quality);
      const retryResponse = await fetch(freshDetails.url, {
        method: 'GET',
        headers,
      });

      if (!retryResponse.ok && retryResponse.status !== 206) {
        return res.status(retryResponse.status).json({ error: 'Failed to fetch audio stream from source' });
      }

      forwardStreamResponse(retryResponse, res);
      return;
    }

    forwardStreamResponse(upstreamResponse, res);
  } catch (err) {
    console.error(`[StreamService] Error streaming ${videoId}:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Error processing stream' });
    }
  }
}

function forwardStreamResponse(upstream, res) {
  res.status(upstream.status);

  // Forward critical streaming headers
  const passThrough = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'last-modified',
    'etag',
  ];

  for (const header of passThrough) {
    const val = upstream.headers.get(header);
    if (val) res.setHeader(header, val);
  }

  // Ensure Accept-Ranges is always set for seeking
  if (!res.getHeader('accept-ranges')) {
    res.setHeader('accept-ranges', 'bytes');
  }

  res.setHeader('cache-control', 'public, max-age=3600');

  // Convert Web ReadableStream to Node.js Readable and pipe to res
  const reader = upstream.body.getReader();

  let closed = false;
  res.on('close', () => {
    closed = true;
    reader.cancel().catch(() => {});
  });

  function pump() {
    if (closed) return;
    reader.read().then(({ done, value }) => {
      if (done || closed) {
        if (!closed) res.end();
        return;
      }
      res.write(value);
      pump();
    }).catch(err => {
      if (!closed) {
        console.warn('[StreamService] Stream pipe error:', err.message);
        res.end();
      }
    });
  }

  pump();
}
