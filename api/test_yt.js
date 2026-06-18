import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create();
  const search = await yt.music.search('billie eilish', { type: 'song' });
  const firstSongId = search.contents[0].contents[0].id;
  const info = await yt.getBasicInfo(firstSongId);
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  
  if (format.decipher) {
    const url = format.decipher(yt.session.player);
    console.log("Deciphered URL:", url);
  } else {
    console.log("No decipher method");
  }
}
test();
