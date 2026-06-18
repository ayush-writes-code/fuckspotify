import play from 'play-dl';

async function test() {
  const search = await play.search('the weeknd', { source: { youtube: 'video' }, limit: 1 });
  console.log("Search Result:", search[0].id, search[0].title);
  
  const stream = await play.stream(search[0].id);
  console.log("Stream URL:", stream.url);
}
test();
