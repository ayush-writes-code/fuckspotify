import saavn from 'saavnapi';

const SaavnAPI = saavn.default || saavn;

async function testLyrics() {
  const searchData = await SaavnAPI.search.searchSongs({ query: "Blinding Lights", page: 0, limit: 1 });
  const songId = searchData.results[0].id;
  
  if (SaavnAPI.songs && SaavnAPI.songs.getSongLyrics) {
    try {
      const lyricsData = await SaavnAPI.songs.getSongLyrics(songId);
      console.log("Lyrics data:", JSON.stringify(lyricsData, null, 2));
    } catch(err) {
      console.log("Err fetching lyrics", err);
    }
  }
}
testLyrics();
