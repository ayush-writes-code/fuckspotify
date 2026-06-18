/* eslint-disable react-refresh/only-export-components, no-unused-vars */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { audioEngine, AUDIO_EVENTS } from '../services/audioEngine';
import { getNextTrackIndex } from '../lib/player';
import { dbService, stores } from '../services/db';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState(() => {
    try { const t = JSON.parse(localStorage.getItem('fuckspotify_lastTrack')); return (t && t.id !== 'default') ? [t] : []; } catch { return []; }
  });
  const [originalPlaylist, setOriginalPlaylist] = useState(() => {
    try { const t = JSON.parse(localStorage.getItem('fuckspotify_lastTrack')); return (t && t.id !== 'default') ? [t] : []; } catch { return []; }
  });
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    try { const t = JSON.parse(localStorage.getItem('fuckspotify_lastTrack')); return (t && t.id !== 'default') ? 0 : -1; } catch { return -1; }
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0 = off, 1 = all, 2 = one
  const [isRadio, setIsRadio] = useState(false);
  const [audioError, setAudioError] = useState('');

  // User Data
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    dbService.getAll(stores.FAVORITES).then(setFavorites).catch(console.error);
    dbService.getAll(stores.PLAYLISTS).then(setPlaylists).catch(console.error);
  }, []);

  const toggleFavorite = async (track) => {
    const isFav = favorites.some(f => f.id === track.id);
    try {
      if (isFav) {
        await dbService.remove(stores.FAVORITES, track.id);
        setFavorites(prev => prev.filter(f => f.id !== track.id));
      } else {
        await dbService.set(stores.FAVORITES, track.id, track);
        setFavorites(prev => [...prev, track]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createPlaylist = async (name) => {
    const newPlaylist = { id: Date.now().toString(), name, tracks: [] };
    await dbService.set(stores.PLAYLISTS, newPlaylist.id, newPlaylist);
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const addToPlaylist = async (playlistId, track) => {
    const pl = playlists.find(p => p.id === playlistId);
    if (pl && !pl.tracks.some(t => t.id === track.id)) {
      const updated = { ...pl, tracks: [...pl.tracks, track] };
      await dbService.set(stores.PLAYLISTS, updated.id, updated);
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));
    }
  };

  const removeFromPlaylist = async (playlistId, trackId) => {
    const pl = playlists.find(p => p.id === playlistId);
    if (pl) {
      const updated = { ...pl, tracks: pl.tracks.filter(t => t.id !== trackId) };
      await dbService.set(stores.PLAYLISTS, updated.id, updated);
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));
    }
  };

  const deletePlaylist = async (playlistId) => {
    await dbService.remove(stores.PLAYLISTS, playlistId);
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  const currentTrack = currentTrackIndex >= 0 && currentPlaylist[currentTrackIndex] 
    ? currentPlaylist[currentTrackIndex] 
    : { id: 'default', title: 'NO TRACK SELECTED', artist: 'fuckspotify', img: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=400', audioUrl: '', time: '0:00' };

  const handleNextRef = useRef(null);

  // Setup Audio Engine Listeners
  useEffect(() => {
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audioEngine.getCurrentTime());
    const handleLoadedMetadata = () => {
      setDuration(audioEngine.getDuration());
      setIsAudioLoading(false);
    };
    const handleWaiting = () => setIsAudioLoading(true);
    const handlePlaying = () => setIsAudioLoading(false);
    const handleError = () => {
      setAudioError('Failed to load audio stream.');
      setIsPlaying(false);
      setIsAudioLoading(false);
    };
    const handleEnded = () => {
      if (handleNextRef.current) handleNextRef.current();
    };

    audioEngine.addEventListener(AUDIO_EVENTS.PLAY, handlePlay);
    audioEngine.addEventListener(AUDIO_EVENTS.PAUSE, handlePause);
    audioEngine.addEventListener(AUDIO_EVENTS.TIME_UPDATE, handleTimeUpdate);
    audioEngine.addEventListener(AUDIO_EVENTS.LOADED_METADATA, handleLoadedMetadata);
    audioEngine.addEventListener(AUDIO_EVENTS.WAITING, handleWaiting);
    audioEngine.addEventListener(AUDIO_EVENTS.PLAYING, handlePlaying);
    audioEngine.addEventListener(AUDIO_EVENTS.ERROR, handleError);
    audioEngine.addEventListener(AUDIO_EVENTS.ENDED, handleEnded);

    return () => {
      audioEngine.removeEventListener(AUDIO_EVENTS.PLAY, handlePlay);
      audioEngine.removeEventListener(AUDIO_EVENTS.PAUSE, handlePause);
      audioEngine.removeEventListener(AUDIO_EVENTS.TIME_UPDATE, handleTimeUpdate);
      audioEngine.removeEventListener(AUDIO_EVENTS.LOADED_METADATA, handleLoadedMetadata);
      audioEngine.removeEventListener(AUDIO_EVENTS.WAITING, handleWaiting);
      audioEngine.removeEventListener(AUDIO_EVENTS.PLAYING, handlePlaying);
      audioEngine.removeEventListener(AUDIO_EVENTS.ERROR, handleError);
      audioEngine.removeEventListener(AUDIO_EVENTS.ENDED, handleEnded);
    };
  }, [currentTrackIndex, currentPlaylist, repeatMode]);

  useEffect(() => {
    if (currentTrack && currentTrack.id !== 'default') {
      localStorage.setItem('fuckspotify_lastTrack', JSON.stringify(currentTrack));
    }
  }, [currentTrack]);

  const handlePlayTrack = useCallback(async (track, playlistContext = [track]) => {
    setAudioError('');
    setIsAudioLoading(true);
    
    const trackIndex = playlistContext.findIndex(t => t.id === track.id);
    
    if (isShuffle) {
      const shuffled = [...playlistContext].sort(() => Math.random() - 0.5);
      const newIndex = shuffled.findIndex(t => t.id === track.id);
      setCurrentPlaylist(shuffled);
      setOriginalPlaylist(playlistContext);
      setCurrentTrackIndex(newIndex);
    } else {
      setCurrentPlaylist(playlistContext);
      setOriginalPlaylist(playlistContext);
      setCurrentTrackIndex(trackIndex >= 0 ? trackIndex : 0);
    }

    try {
      const url = `/api/audio?id=${encodeURIComponent(track.id)}`;
      audioEngine.setSrc(url);
      await audioEngine.play();
    } catch (err) {
      console.error(err);
      setAudioError('Playback failed');
      setIsAudioLoading(false);
    }
  }, [isShuffle]);

  const handleTogglePlay = useCallback(() => {
    if (currentTrack.id === 'default') return;
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play().catch(e => {
        setAudioError('Playback failed');
        console.error(e);
      });
    }
  }, [isPlaying, currentTrack]);

  const handleNext = useCallback(() => {
    if (repeatMode === 2) {
      audioEngine.seek(0);
      audioEngine.play();
      return;
    }
    const nextIdx = getNextTrackIndex(currentTrackIndex, currentPlaylist.length, repeatMode);
    if (nextIdx !== null) {
      handlePlayTrack(currentPlaylist[nextIdx], isShuffle ? originalPlaylist : currentPlaylist);
    } else {
      audioEngine.pause();
      audioEngine.seek(0);
    }
  }, [currentTrackIndex, currentPlaylist, repeatMode, isShuffle, originalPlaylist, handlePlayTrack]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }
    let prevIdx = currentTrackIndex - 1;
    if (prevIdx < 0 && repeatMode > 0) prevIdx = currentPlaylist.length - 1;
    
    if (prevIdx >= 0) {
      handlePlayTrack(currentPlaylist[prevIdx], isShuffle ? originalPlaylist : currentPlaylist);
    } else {
      audioEngine.seek(0);
    }
  }, [currentTime, currentTrackIndex, currentPlaylist, repeatMode, isShuffle, originalPlaylist, handlePlayTrack]);

  const handleSeek = (time) => {
    audioEngine.seek(time);
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol) => {
    audioEngine.setVolume(vol);
    setVolume(vol);
  };

  const toggleShuffle = () => {
    if (isShuffle) {
      // Turn off
      const currentId = currentPlaylist[currentTrackIndex]?.id;
      setCurrentPlaylist(originalPlaylist);
      setCurrentTrackIndex(originalPlaylist.findIndex(t => t.id === currentId));
      setIsShuffle(false);
    } else {
      // Turn on
      const currentTrack = currentPlaylist[currentTrackIndex];
      const remaining = currentPlaylist.filter((_, i) => i !== currentTrackIndex);
      const shuffled = [currentTrack, ...remaining.sort(() => Math.random() - 0.5)];
      setOriginalPlaylist(currentPlaylist);
      setCurrentPlaylist(shuffled);
      setCurrentTrackIndex(0);
      setIsShuffle(true);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  const addToQueue = (track) => {
    setCurrentPlaylist(prev => [...prev, track]);
    setOriginalPlaylist(prev => [...prev, track]);
  };

  const removeFromQueue = (index) => {
    const trackToRemove = currentPlaylist[index];
    const newCurrent = [...currentPlaylist];
    newCurrent.splice(index, 1);
    
    const origIndex = originalPlaylist.findIndex(t => t.id === trackToRemove.id);
    const newOrig = [...originalPlaylist];
    if (origIndex > -1) newOrig.splice(origIndex, 1);
    
    setCurrentPlaylist(newCurrent);
    setOriginalPlaylist(newOrig);
    
    if (index < currentTrackIndex) {
      setCurrentTrackIndex(prev => prev - 1);
    } else if (index === currentTrackIndex) {
      if (newCurrent.length > 0) {
        handlePlayTrack(newCurrent[Math.min(index, newCurrent.length - 1)], isShuffle ? newOrig : newCurrent);
      } else {
        audioEngine.pause();
        audioEngine.setSrc('');
        setCurrentTrackIndex(-1);
      }
    }
  };

  // Update Media Session when track changes
  useEffect(() => {
    if (currentTrack.id !== 'default') {
      audioEngine.setupMediaSession(currentTrack, handleTogglePlay, handleTogglePlay, handleSeek, handlePrev, handleNext);
    }
  }, [currentTrack, handleTogglePlay, handleSeek, handlePrev, handleNext]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, currentPlaylist, currentTrackIndex, originalPlaylist,
      isPlaying, isAudioLoading, currentTime, duration, volume,
      isShuffle, repeatMode, audioError, isRadio, setIsRadio,
      setCurrentPlaylist, setCurrentTrackIndex,
      favorites, playlists,
      handlePlayTrack, handleTogglePlay, handleNext, handlePrev, handleSeek,
      handleVolumeChange, toggleShuffle, toggleRepeat,
      addToQueue, removeFromQueue,
      toggleFavorite, createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
