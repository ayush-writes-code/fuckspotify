import saavn from 'saavnapi';
const SaavnAPI = saavn.default || saavn;

console.log('Keys:', Object.keys(SaavnAPI));
if (SaavnAPI.songs) {
  console.log('songs:', Object.keys(SaavnAPI.songs));
}
if (SaavnAPI.search) {
  console.log('search:', Object.keys(SaavnAPI.search));
}

async function run() {
  const res = await SaavnAPI.search.searchSongs({query: 'the weeknd', page: 0, limit: 1});
  console.log(res);
}
run();
