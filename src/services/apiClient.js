export const apiClient = {
  async search(query, options = {}) {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Music service is unavailable');
    }

    return data.results || [];
  },

  async getLyrics(title, artist, options = {}) {
    const res = await fetch(`/api/lyrics?track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Lyrics service is unavailable');
    }

    return data;
  },

  getAudioUrl(trackId) {
    return `/api/audio?id=${encodeURIComponent(trackId)}`;
  }
};
