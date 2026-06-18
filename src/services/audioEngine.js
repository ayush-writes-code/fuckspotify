export const AUDIO_EVENTS = {
  PLAY: 'play',
  PAUSE: 'pause',
  TIME_UPDATE: 'timeupdate',
  ENDED: 'ended',
  ERROR: 'error',
  LOADED_METADATA: 'loadedmetadata',
  WAITING: 'waiting',
  PLAYING: 'playing',
};

class AudioEngine extends EventTarget {
  constructor() {
    super();
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    this.setupListeners();
  }

  setupListeners() {
    Object.values(AUDIO_EVENTS).forEach(eventName => {
      this.audio.addEventListener(eventName, (e) => {
        this.dispatchEvent(new Event(eventName));
      });
    });
  }

  setSrc(url) {
    this.audio.src = url;
  }

  play() {
    return this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  setVolume(volume) {
    this.audio.volume = volume;
  }

  getVolume() {
    return this.audio.volume;
  }

  seek(time) {
    this.audio.currentTime = time;
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  getDuration() {
    return this.audio.duration || 0;
  }

  setupMediaSession(track, onPlay, onPause, onSeek, onPrev, onNext) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        artwork: [{ src: track.img, sizes: '512x512', type: 'image/jpeg' }]
      });

      navigator.mediaSession.setActionHandler('play', onPlay);
      navigator.mediaSession.setActionHandler('pause', onPause);
      navigator.mediaSession.setActionHandler('previoustrack', onPrev);
      navigator.mediaSession.setActionHandler('nexttrack', onNext);
      navigator.mediaSession.setActionHandler('seekto', (details) => onSeek(details.seekTime));
    }
  }
}

export const audioEngine = new AudioEngine();
