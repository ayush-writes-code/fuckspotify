import { Innertube } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create();
  console.log("YT created");
  const search = await yt.music.search('the weeknd', { type: 'song' });
  console.log("YT Search:");
  console.log(search.contents[0].contents[0].title);
  
  try {
    const saavn = await import('saavnapi');
    console.log("Saavn imports", Object.keys(saavn));
  } catch (e) {
    console.log("Saavn error", e);
  }
}
test();
