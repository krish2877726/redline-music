import { Innertube } from 'youtubei.js';
import { searchCache, homeCache } from '../utils/cache.js';

let innertubeInstance = null;
let initPromise = null;

export async function getInnertube() {
  if (innertubeInstance) return innertubeInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      innertubeInstance = await Innertube.create({
        cache: undefined,
        generate_session_locally: true,
      });
      console.log(' [Innertube] YouTube Music Engine initialized successfully');
      return innertubeInstance;
    } catch (err) {
      console.error(' [Innertube] Initialization error:', err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Get instant search suggestions (cached 1 hr)
 */
export async function getSearchSuggestions(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const cached = searchCache.get(`sugg:${q}`);
  if (cached) return cached;

  try {
    const yt = await getInnertube();
    const suggestions = await yt.music.getSearchSuggestions(q);
    const results = [];
    const seen = new Set();

    if (Array.isArray(suggestions)) {
      for (const section of suggestions) {
        if (section.contents) {
          for (const item of section.contents) {
            const text = item.suggestion ? item.suggestion.toString() : (item.title ? item.title.toString() : '');
            if (text && !seen.has(text.toLowerCase())) {
              seen.add(text.toLowerCase());
              results.push(text);
            }
          }
        }
      }
    }

    const finalResults = results.slice(0, 10);
    searchCache.set(`sugg:${q}`, finalResults, 60 * 60 * 1000);
    return finalResults;
  } catch (err) {
    console.warn(`[Innertube] Failed to get suggestions for "${query}":`, err.message);
    return [];
  }
}

/**
 * Optimized search on YouTube Music
 * Avoids 429 by querying only songs & artists concurrently on 'all', caching aggressively
 */
export async function searchMusic(query, type = 'all') {
  if (!query || !query.trim()) {
    return { songs: [], artists: [], albums: [], playlists: [] };
  }

  const q = query.trim();
  const cacheKey = `search:${type}:${q.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const yt = await getInnertube();
  const response = {
    query: q,
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
  };

  try {
    if (type === 'songs' || type === 'all') {
      const promises = [yt.music.search(q, { type: 'song' })];
      if (type === 'all') {
        promises.push(yt.music.search(q, { type: 'artist' }));
        promises.push(yt.music.search(q, { type: 'album' }));
      }

      const results = await Promise.allSettled(promises);
      const songRes = results[0];
      if (songRes.status === 'fulfilled' && songRes.value) {
        const shelf = songRes.value.contents?.find(c => c.type === 'MusicShelf') || songRes.value.contents?.[0];
        if (shelf && shelf.contents) {
          response.songs = shelf.contents.map(item => parseSongItem(item)).filter(Boolean);
        }
      }

      if (results[1] && results[1].status === 'fulfilled' && results[1].value) {
        const shelf = results[1].value.contents?.find(c => c.type === 'MusicShelf') || results[1].value.contents?.[0];
        if (shelf && shelf.contents) {
          response.artists = shelf.contents.map(item => parseArtistItem(item)).filter(Boolean);
        }
      }

      if (results[2] && results[2].status === 'fulfilled' && results[2].value) {
        const shelf = results[2].value.contents?.find(c => c.type === 'MusicShelf') || results[2].value.contents?.[0];
        if (shelf && shelf.contents) {
          response.albums = shelf.contents.map(item => parseAlbumItem(item)).filter(Boolean);
        }
      }
    } else if (type === 'artists') {
      const artistResults = await yt.music.search(q, { type: 'artist' });
      const shelf = artistResults.contents?.find(c => c.type === 'MusicShelf') || artistResults.contents?.[0];
      if (shelf && shelf.contents) {
        response.artists = shelf.contents.map(item => parseArtistItem(item)).filter(Boolean);
      }
    } else if (type === 'albums') {
      const albumResults = await yt.music.search(q, { type: 'album' });
      const shelf = albumResults.contents?.find(c => c.type === 'MusicShelf') || albumResults.contents?.[0];
      if (shelf && shelf.contents) {
        response.albums = shelf.contents.map(item => parseAlbumItem(item)).filter(Boolean);
      }
    } else if (type === 'playlists') {
      const plResults = await yt.music.search(q, { type: 'playlist' });
      const shelf = plResults.contents?.find(c => c.type === 'MusicShelf') || plResults.contents?.[0];
      if (shelf && shelf.contents) {
        response.playlists = shelf.contents.map(item => parsePlaylistItem(item)).filter(Boolean);
      }
    }

    // Cache results for 15 minutes
    searchCache.set(cacheKey, response, 15 * 60 * 1000);
    return response;
  } catch (err) {
    console.error(`[Innertube] Search error for "${q}":`, err.message);
    return response;
  }
}

/**
 * Get trending songs & popular charts from YouTube Music
 */
export async function getTrendingMusic() {
  const cached = homeCache.get('trending_charts');
  if (cached) return cached;

  try {
    const yt = await getInnertube();
    const searchRes = await yt.music.search('Trending Hits', { type: 'song' });
    const shelf = searchRes.contents?.find(c => c.type === 'MusicShelf') || searchRes.contents?.[0];
    const songs = shelf && shelf.contents ? shelf.contents.map(item => parseSongItem(item)).filter(Boolean) : [];

    const result = {
      title: 'Trending Global',
      songs: songs.slice(0, 25),
    };

    homeCache.set('trending_charts', result, 30 * 60 * 1000);
    return result;
  } catch (err) {
    console.warn('[Innertube] Trending error:', err.message);
    return { title: 'Trending Global', songs: [] };
  }
}

/**
 * Get Explore / Home recommended shelves
 */
export async function getExploreShelves() {
  const cached = homeCache.get('explore_shelves');
  if (cached) return cached;

  try {
    const yt = await getInnertube();
    const explore = await yt.music.getExplore();
    const sections = explore.sections || explore.contents || [];

    const shelves = [];
    for (const section of sections) {
      const title = section.header?.title?.toString() || section.title?.toString() || '';
      if (!title || !section.contents) continue;

      const items = section.contents.slice(0, 15).map(item => {
        let thumbnail = '';
        if (Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
          thumbnail = item.thumbnails[item.thumbnails.length - 1].url;
        } else if (item.thumbnail?.contents?.[0]?.url) {
          thumbnail = item.thumbnail.contents[0].url;
        }

        return {
          id: item.id || '',
          title: item.title?.toString() || '',
          subtitle: item.subtitle?.toString() || item.authors?.[0]?.name || '',
          thumbnail,
          type: item.type === 'MusicTwoRowItem' ? 'album' : 'track',
        };
      }).filter(it => it.title);

      if (items.length > 0) {
        shelves.push({ title, items });
      }
    }

    homeCache.set('explore_shelves', shelves, 60 * 60 * 1000);
    return shelves;
  } catch (err) {
    console.warn('[Innertube] Explore shelves error:', err.message);
    return [];
  }
}

/**
 * Get related tracks for Autoplay
 */
export async function getRelatedTracks(videoId, songTitle, artistName) {
  const query = `${songTitle || ''} ${artistName || ''} radio`.trim();
  if (!query) return [];

  const cacheKey = `rel:${videoId || query}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    const yt = await getInnertube();
    const searchRes = await yt.music.search(query, { type: 'song' });
    const shelf = searchRes.contents?.find(c => c.type === 'MusicShelf') || searchRes.contents?.[0];
    const songs = shelf && shelf.contents
      ? shelf.contents
          .map(item => parseSongItem(item))
          .filter(Boolean)
          .filter(s => s.id !== videoId)
      : [];

    searchCache.set(cacheKey, songs, 30 * 60 * 1000);
    return songs.slice(0, 10);
  } catch (err) {
    console.warn('[Innertube] Related tracks error:', err.message);
    return [];
  }
}

/**
 * Get Artist Details & Songs from YouTube Music
 */
export async function getArtistDetails(browseId) {
  if (!browseId) return null;
  const cacheKey = `artist:${browseId}`;
  const cached = homeCache.get(cacheKey);
  if (cached) return cached;

  try {
    const yt = await getInnertube();
    let id = browseId;
    if (!id.startsWith('UC')) {
      const s = await yt.music.search(browseId, { type: 'artist' });
      const shelf = s.contents?.find(c => c.type === 'MusicShelf') || s.contents?.[0];
      const match = shelf?.contents?.[0];
      if (match?.id) id = match.id;
    }

    const artistData = await yt.music.getArtist(id);
    const title = artistData.header?.title?.text || artistData.header?.title?.toString() || browseId;
    let thumbnail = '';
    if (artistData.header?.thumbnails?.length) {
      thumbnail = artistData.header.thumbnails[0].url;
    } else if (artistData.header?.thumbnail?.url) {
      thumbnail = artistData.header.thumbnail.url;
    }

    // Extract songs
    let songs = [];
    const songShelf = artistData.sections?.find(s => s.type === 'MusicShelf' || s.title?.text?.toLowerCase().includes('song'));
    if (songShelf && songShelf.contents) {
      songs = songShelf.contents.map(item => parseSongItem(item)).filter(Boolean);
    }

    // If songs list is empty, search top songs for this artist
    if (!songs.length) {
      const s = await yt.music.search(title, { type: 'song' });
      const shelf = s.contents?.find(c => c.type === 'MusicShelf') || s.contents?.[0];
      if (shelf && shelf.contents) {
        songs = shelf.contents.map(item => parseSongItem(item)).filter(Boolean).slice(0, 20);
      }
    }

    const result = {
      id,
      name: title,
      thumbnail,
      songs,
      subscribers: artistData.header?.subscribers?.text || '',
    };

    homeCache.set(cacheKey, result, 60 * 60 * 1000);
    return result;
  } catch (err) {
    console.warn(`[Innertube] getArtistDetails error for ${browseId}:`, err.message);
    try {
      const yt = await getInnertube();
      const s = await yt.music.search(browseId, { type: 'song' });
      const shelf = s.contents?.find(c => c.type === 'MusicShelf') || s.contents?.[0];
      const songs = shelf && shelf.contents ? shelf.contents.map(item => parseSongItem(item)).filter(Boolean).slice(0, 20) : [];
      return {
        id: browseId,
        name: browseId,
        thumbnail: songs[0]?.thumbnail || '',
        songs,
      };
    } catch (_) {
      return null;
    }
  }
}

/**
 * Get Album Details & Tracks from YouTube Music
 */
export async function getAlbumDetails(browseId) {
  if (!browseId) return null;
  const cacheKey = `album:${browseId}`;
  const cached = homeCache.get(cacheKey);
  if (cached) return cached;

  try {
    const yt = await getInnertube();
    const albumData = await yt.music.getAlbum(browseId);
    const title = albumData.header?.title?.text || albumData.header?.title?.toString() || albumData.title || 'Album';
    const artist = albumData.header?.author?.name || albumData.header?.artists?.[0]?.name || '';
    let thumbnail = '';
    if (albumData.header?.thumbnails?.length) {
      thumbnail = albumData.header.thumbnails[0].url;
    } else if (albumData.header?.thumbnail?.url) {
      thumbnail = albumData.header.thumbnail.url;
    }

    const songs = (albumData.contents || []).map(item => parseSongItem(item)).filter(Boolean);

    const result = {
      id: browseId,
      title,
      artist,
      thumbnail,
      songs,
      year: albumData.header?.year || '',
    };

    homeCache.set(cacheKey, result, 60 * 60 * 1000);
    return result;
  } catch (err) {
    console.warn(`[Innertube] getAlbumDetails error for ${browseId}:`, err.message);
    return null;
  }
}

// Helper Parsers
function parseSongItem(item) {
  if (!item || !item.id) return null;
  const title = item.title?.text || (item.title ? item.title.toString() : 'Unknown Title');
  const artist = item.artists?.[0]?.name || (item.author ? item.author.name || item.author.toString() : 'Various Artists');
  const album = item.album?.name || (item.album ? item.album.toString() : '');
  const duration = item.duration?.seconds || 0;
  const durationText = item.duration?.text || (duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : '0:00');

  // Extract base thumbnail URL cleanly
  let thumbnail = '';
  if (Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
    thumbnail = item.thumbnails[0].url;
  } else if (item.thumbnail?.contents?.[0]?.url) {
    thumbnail = item.thumbnail.contents[0].url;
  }

  return {
    id: item.id,
    title,
    artist,
    artistId: item.artists?.[0]?.channel_id || '',
    album,
    albumId: item.album?.id || '',
    duration,
    durationText,
    thumbnail,
    explicit: !!item.badges?.some(b => b.label?.toLowerCase() === 'explicit'),
    source: 'ytmusic',
  };
}

function parseArtistItem(item) {
  if (!item) return null;
  const id = item.id || item.endpoint?.payload?.browseId || '';
  const name = item.name || item.title?.text || (item.title ? item.title.toString() : 'Unknown Artist');
  let thumbnail = '';
  if (Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
    thumbnail = item.thumbnails[0].url;
  }
  return {
    id,
    name,
    thumbnail,
    subscribers: item.subscribers?.text || '',
    source: 'ytmusic',
  };
}

function parseAlbumItem(item) {
  if (!item) return null;
  const id = item.id || item.endpoint?.payload?.browseId || '';
  const title = item.title?.text || (item.title ? item.title.toString() : 'Unknown Album');
  const artist = item.artists?.[0]?.name || (item.author ? item.author.name || item.author.toString() : '');
  let thumbnail = '';
  if (Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
    thumbnail = item.thumbnails[0].url;
  }
  return {
    id,
    title,
    artist,
    year: item.year || '',
    type: item.album_type || 'Album',
    thumbnail,
    source: 'ytmusic',
  };
}

function parsePlaylistItem(item) {
  if (!item) return null;
  const id = item.id || item.endpoint?.payload?.browseId || '';
  const title = item.title?.text || (item.title ? item.title.toString() : 'Unknown Playlist');
  const author = item.author?.name || 'YouTube Music';
  let thumbnail = '';
  if (Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
    thumbnail = item.thumbnails[0].url;
  }
  return {
    id,
    title,
    author,
    itemCount: item.item_count || '',
    thumbnail,
    source: 'ytmusic',
  };
}
