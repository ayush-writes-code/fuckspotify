/* global process */
import express from 'express';
import cors from 'cors';
import spotifyUrlInfo from 'spotify-url-info';
import saavn from 'saavnapi';

const SaavnAPI = saavn.default || saavn;
const spotify = spotifyUrlInfo(fetch);

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim());

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
}));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const UPSTREAM_TIMEOUT_MS = 10_000;

const readQueryParam = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
};

const withTimeout = async (promise, message = 'Upstream service timed out') => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), UPSTREAM_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const getBestStreamUrl = async (id) => {
  const data = await withTimeout(SaavnAPI.songs.getSongByIds({ songIds: [id] }));
  const downloadUrls = data?.[0]?.downloadUrl || [];
  const best = downloadUrls.find(url => url.quality === '320kbps') || downloadUrls.at(-1);
  return best?.url || null;
};

// 1. Search Endpoint
app.get('/api/search', async (req, res) => {
  const query = readQueryParam(req.query.q, 120);
  if (!query) return res.status(400).json({ error: 'Query "q" must be between 1 and 120 characters' });

  try {
    const data = await withTimeout(SaavnAPI.search.searchSongs({ query, page: 0, limit: 10 }));
    const saavnResults = (data.results || []).map(item => {
      // Find best image
      const img = item.image.find(i => i.quality === '500x500') || item.image[item.image.length - 1];
      // Format duration
      const mins = Math.floor(item.duration / 60);
      const secs = (item.duration % 60).toString().padStart(2, '0');
      
      return {
        id: item.id,
        title: item.name,
        artist: item.artists?.primary?.[0]?.name || 'Unknown Artist',
        time: `${mins}:${secs}`,
        img: img?.url || 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=400',
        source: 'saavn'
      };
    });
    res.json({ results: saavnResults });
  } catch (error) {
    console.error('JioSaavn search error:', error);
    res.status(502).json({ error: 'Music search is temporarily unavailable' });
  }
});

// 2. Stream Endpoint (Get audio URL)
app.get('/api/stream', async (req, res) => {
  const id = readQueryParam(req.query.id, 100);
  if (!id) return res.status(400).json({ error: 'A valid song id is required' });

  try {
    const streamUrl = await getBestStreamUrl(id);
    if (streamUrl) return res.json({ streamUrl });
    res.status(404).json({ error: 'Stream not found' });
  } catch (error) {
    console.error('Stream fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stream URL' });
  }
});

// Browser-friendly audio endpoint. Keeping lookup behind one media URL preserves
// user-initiated playback while the upstream stream URL is being resolved.
app.get('/api/audio', async (req, res) => {
  const id = readQueryParam(req.query.id, 100);
  if (!id) return res.status(400).json({ error: 'A valid song id is required' });

  try {
    const streamUrl = await getBestStreamUrl(id);
    if (!streamUrl) return res.status(404).json({ error: 'Stream not found' });
    return res.redirect(307, streamUrl);
  } catch (error) {
    console.error('Audio redirect error:', error);
    return res.status(502).json({ error: 'Audio stream is temporarily unavailable' });
  }
});

// 3. Spotify/Playlist Import Endpoint
app.get('/api/import', async (req, res) => {
  const url = readQueryParam(req.query.url, 500);
  if (!url) return res.status(400).json({ error: 'Spotify URL required' });

  try {
    const parsedUrl = new URL(url);
    if (!['open.spotify.com', 'spotify.com'].includes(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'Only Spotify playlist URLs are supported' });
    }
  } catch {
    return res.status(400).json({ error: 'A valid Spotify URL is required' });
  }

  try {
    const data = await withTimeout(spotify.getTracks(url), 'Spotify import timed out');
    const tracks = data.map(t => ({
      title: t.name,
      artist: t.artists ? t.artists.map(a => a.name).join(', ') : 'Unknown',
      duration: t.duration_ms || 0
    }));
    res.json({ success: true, tracks });
  } catch (error) {
    console.error('Import error:', error.message);
    res.status(500).json({ error: 'Failed to parse playlist. Ensure it is public.' });
  }
});

// 4. Lyrics Endpoint (lrclib)
app.get('/api/lyrics', async (req, res) => {
  const track = readQueryParam(req.query.track, 200);
  const artist = readQueryParam(req.query.artist, 200);
  if (!track || !artist) return res.status(400).json({ error: 'Valid track and artist values are required' });

  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(track + ' ' + artist)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'fuckspotify (https://github.com/ayush-writes-code/fuckspotify)' },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`LRCLIB returned ${response.status}`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      const bestMatch = data[0];
      return res.json({
        plainLyrics: bestMatch.plainLyrics,
        syncedLyrics: bestMatch.syncedLyrics
      });
    }
    res.status(404).json({ error: 'Lyrics not found' });
  } catch (error) {
    console.error('Lyrics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Music Backend running on port ${PORT}`);
  });
}

export default app;
