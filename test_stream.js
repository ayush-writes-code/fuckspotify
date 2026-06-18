import saavn from 'saavnapi';
const SaavnAPI = saavn.default || saavn;

async function test() {
  try {
    const data = await SaavnAPI.songs.getSongByIds({ songIds: ['TcDP-KUl'] });
    console.log(JSON.stringify(data[0].downloadUrl, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
