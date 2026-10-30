import { lyricsCache } from '../utils/cache.js';

/**
 * Fetch and parse synchronized lyrics from LRCLIB
 */
export async function getLyrics(trackName, artistName, durationSec = 0) {
  if (!trackName) return { synced: [], plain: '', isSynced: false };

  // Clean track title (strip out "(Official Video)", "feat. ...", etc. for higher match rate)
  const cleanTrack = trackName
    .replace(/\s*[\(\[](official\s*(music\s*)?(video|audio)|visualizer|lyrics|explicit|remaster(ed)?)[\)\]]/gi, '')
    .trim();
  const cleanArtist = (artistName || '').replace(/\s*-\s*topic$/i, '').trim();

  const cacheKey = `lyrics:${cleanTrack.toLowerCase()}:${cleanArtist.toLowerCase()}`;
  const cached = lyricsCache.get(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      track_name: cleanTrack,
    });
    if (cleanArtist) params.append('artist_name', cleanArtist);
    if (durationSec > 0) params.append('duration', Math.round(durationSec));

    const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: {
        'User-Agent': 'Redline-Music-App/2.0 (github.com/snitrix/redline)',
      },
    });

    if (!response.ok) {
      // Try search endpoint if exact get didn't match
      return await searchLrclib(cleanTrack, cleanArtist);
    }

    const data = await response.json();
    const parsed = parseLrcResponse(data);
    lyricsCache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.warn(`[LyricsService] Error fetching lyrics for "${cleanTrack}":`, err.message);
    return { synced: [], plain: '', isSynced: false };
  }
}

async function searchLrclib(trackName, artistName) {
  try {
    const params = new URLSearchParams({
      q: `${trackName} ${artistName || ''}`.trim(),
    });
    const res = await fetch(`https://lrclib.net/api/search?${params.toString()}`, {
      headers: { 'User-Agent': 'Redline-Music-App/2.0' },
    });
    if (!res.ok) return { synced: [], plain: '', isSynced: false };
    const list = await res.json();
    if (Array.isArray(list) && list.length > 0) {
      // Pick first result with syncedLyrics, or first result
      const item = list.find(x => x.syncedLyrics) || list[0];
      return parseLrcResponse(item);
    }
  } catch (e) {
    // Ignore
  }
  return { synced: [], plain: '', isSynced: false };
}

function parseLrcResponse(data) {
  if (!data) return { synced: [], plain: '', isSynced: false };

  if (data.syncedLyrics) {
    const lines = parseLrcText(data.syncedLyrics);
    return {
      synced: lines,
      plain: data.plainLyrics || lines.map(l => l.text).join('\n'),
      isSynced: lines.length > 0,
      instrumental: data.instrumental || false,
    };
  }

  if (data.plainLyrics) {
    const plainLines = data.plainLyrics
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    return {
      synced: plainLines.map((text, i) => ({ time: i * 5, text })), // approximate
      plain: data.plainLyrics,
      isSynced: false,
      instrumental: data.instrumental || false,
    };
  }

  return {
    synced: [],
    plain: data.instrumental ? 'Instrumental track. No lyrics.' : '',
    isSynced: false,
    instrumental: data.instrumental || false,
  };
}

/**
 * Parse standard LRC format [mm:ss.xx] text into array of { time: seconds, text: string }
 */
export function parseLrcText(lrcString) {
  if (!lrcString) return [];
  const lines = lrcString.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    if (!matches.length) continue;

    const text = line.replace(timeRegex, '').trim();
    if (!text && result.length === 0) continue; // skip leading blanks

    for (const match of matches) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const timeInSec = min * 60 + sec + ms / 1000;

      result.push({
        time: timeInSec,
        text: text || '♪',
      });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}
