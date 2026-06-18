export function getNextTrackIndex(currentIndex, playlistLength, repeatMode = 0) {
  if (playlistLength <= 0 || currentIndex < 0) return null;

  const nextIndex = currentIndex + 1;
  if (nextIndex < playlistLength) return nextIndex;

  return repeatMode > 0 ? 0 : null;
}

export function parseLRC(lrcString = '') {
  const parsed = [];
  const timeRegex = /\[(\d{2}):(\d{2})[.:](\d{2,3})\]/g;

  lrcString.split('\n').forEach((line) => {
    const timestamps = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();

    if (!text) return;

    timestamps.forEach((match) => {
      const minutes = Number.parseInt(match[1], 10);
      const seconds = Number.parseInt(match[2], 10);
      const millis = Number.parseInt(match[3].padEnd(3, '0'), 10);
      parsed.push({ time: minutes * 60 + seconds + millis / 1000, text });
    });
  });

  return parsed.sort((a, b) => a.time - b.time);
}
