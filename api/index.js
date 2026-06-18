import express from 'express';
import cors from 'cors';
import spotifyUrlInfo from 'spotify-url-info';
import saavn from 'saavnapi';

const SaavnAPI = saavn.default || saavn;
const spotify = spotifyUrlInfo(fetch);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// 1. Search Endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query parameter "q" is required' });

  try {
    const data = await SaavnAPI.search.searchSongs({ query, page: 0, limit: 10 });
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
    res.json({ results: [] });
  }
});

// 2. Stream Endpoint (Get audio URL)
app.get('/api/stream', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const data = await SaavnAPI.songs.getSongByIds({ songIds: id });
    if (data && data[0]) {
      const dUrls = data[0].downloadUrl;
      const bestUrl = dUrls.find(u => u.quality === '320kbps') || dUrls[dUrls.length - 1];
      return res.json({ streamUrl: bestUrl.url });
    }
    res.status(404).json({ error: 'Stream not found' });
  } catch (error) {
    console.error('Stream fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stream URL' });
  }
});

// 3. Spotify/Playlist Import Endpoint
app.get('/api/import', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Spotify URL required' });

  try {
    const data = await spotify.getTracks(url);
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Music Backend running on port ${PORT}`);
  });
}

export default app;
