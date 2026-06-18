import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Home, Radio, Compass, Disc, 
  Play, Pause, SkipBack, SkipForward, 
  Shuffle, Repeat, Repeat1, Volume2, MoreHorizontal, Heart, Mic2, Loader2, ChevronDown, MessageCircle,
  Library, Plus, X, Download, ListMusic, Share
} from 'lucide-react';
import './index.css';

const CATEGORIES = [
  { id: 1, name: 'HIP-HOP', img: 'https://images.unsplash.com/photo-1605020420620-20c943cc4669?q=80&w=400' },
  { id: 2, name: 'ELECTRONIC', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400' },
  { id: 3, name: 'POP', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400' },
  { id: 4, name: 'ROCK', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400' },
];

const DEFAULT_TRACK = {
  id: 'default',
  title: 'NO TRACK SELECTED',
  artist: 'fuckspotify',
  img: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=400',
  audioUrl: '',
  time: '0:00'
};

function App() {
  const [activeTab, setActiveTab] = useState('new');
  
  // Data States
  const [newTracks, setNewTracks] = useState([]);
  const [homeTracks, setHomeTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Playback States
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
  const [progress, setProgress] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0); 
  const [volume, setVolume] = useState(0.8);
  const [isRadio, setIsRadio] = useState(false);
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0 = off, 1 = all, 2 = one
  
  // User Storage States
  const [favorites, setFavorites] = useState(() => {
    try { const f = JSON.parse(localStorage.getItem('fuckspotify_favs')); return f || []; } catch { return []; }
  });
  const [playlists, setPlaylists] = useState(() => {
    try { const p = JSON.parse(localStorage.getItem('fuckspotify_playlists')); return p || []; } catch { return []; }
  });
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  // PWA Install States
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState(null);

  // Mobile & Overlay UI States
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [lyrics, setLyrics] = useState({ type: 'empty', data: null });
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAutoplaying, setIsAutoplaying] = useState(false);

  // Refs
  const audioRef = useRef(new Audio());
  const searchTimeoutRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

  // Vinyl Widget State
  const vinylRef = useRef(null);
  const vinylAngleRef = useRef(0);
  const vinylAnimRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const isScratchingRef = useRef(false);
  const scratchStartAngleRef = useRef(0);
  const scratchStartTimeRef = useRef(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const currentTrack = currentTrackIndex >= 0 && currentPlaylist[currentTrackIndex] 
    ? currentPlaylist[currentTrackIndex] 
    : DEFAULT_TRACK;

  // Save Last Played Track
  useEffect(() => {
    if (currentTrack && currentTrack.id !== 'default' && !isRadio) {
      localStorage.setItem('fuckspotify_lastTrack', JSON.stringify(currentTrack));
    }
  }, [currentTrack, isRadio]);

  // Global click listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Window resize listener to detect mobile dynamically
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- PWA Custom Install Prompt ---
  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Check if user previously dismissed or installed
      const hasDismissed = localStorage.getItem('fuckspotify_dismissed_install');
      const hasInstalled = localStorage.getItem('fuckspotify_installed');
      // Also check if we are already running standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      
      if (!hasDismissed && !hasInstalled && !isStandalone) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    setShowInstallPrompt(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('fuckspotify_installed', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismissPwa = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('fuckspotify_dismissed_install', 'true');
  };

  // --- iOS PWA Install Prompt ---
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const hasDismissed = localStorage.getItem('fuckspotify_dismissed_ios_install');

    if (isIOS && !isStandalone && !hasDismissed) {
      setShowIOSInstallPrompt(true);
    }
  }, []);

  const handleDismissIOSPwa = () => {
    setShowIOSInstallPrompt(false);
    localStorage.setItem('fuckspotify_dismissed_ios_install', 'true');
  };

  // --- API Fetching ---
  const fetchMusicApi = async (query) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('Error fetching music:', err);
      return [];
    }
  };

  // --- Queue Logic ---
  const handlePlayNext = (track) => {
    if (currentPlaylist.length === 0 || currentTrack.id === 'default') {
      handlePlayTrack(track, [track]);
      return;
    }
    const newPlaylist = [...currentPlaylist];
    newPlaylist.splice(currentTrackIndex + 1, 0, track);
    setCurrentPlaylist(newPlaylist);
    
    // Sync originalPlaylist
    const origIndex = originalPlaylist.findIndex(t => t.id === currentTrack.id);
    if (origIndex !== -1) {
      const newOrig = [...originalPlaylist];
      newOrig.splice(origIndex + 1, 0, track);
      setOriginalPlaylist(newOrig);
    }
    setDropdownOpenId(null);
  };

  const handleAddToQueue = (track) => {
    if (currentPlaylist.length === 0 || currentTrack.id === 'default') {
      handlePlayTrack(track, [track]);
      return;
    }
    setCurrentPlaylist(prev => [...prev, track]);
    setOriginalPlaylist(prev => [...prev, track]);
    setDropdownOpenId(null);
  };

  useEffect(() => {
    fetchMusicApi('billie eilish').then(tracks => {
      setNewTracks(tracks);
      setIsLoadingNew(false);
    });
    fetchMusicApi('the weeknd').then(tracks => {
      setHomeTracks(tracks);
      setIsLoadingHome(false);
    });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setTimeout(() => setSearchResults([]), 0);
      return;
    }
    setTimeout(() => setIsLoadingSearch(true), 0);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchMusicApi(searchQuery).then(tracks => {
        setSearchResults(tracks);
        setIsLoadingSearch(false);
      });
    }, 500);
  }, [searchQuery]);

  // --- LRC Parsing ---
  const parseLRC = (lrcString) => {
    const lines = lrcString.split('\n');
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    lines.forEach(line => {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const millis = parseInt(match[3].padEnd(3, '0'), 10);
        const time = minutes * 60 + seconds + millis / 1000;
        const text = line.replace(timeRegex, '').trim();
        if (text) {
          parsed.push({ time, text });
        }
      }
    });
    return parsed;
  };

  // --- Lyrics Fetching ---
  useEffect(() => {
    if (isLyricsOpen && currentTrack.id !== 'default' && !isRadio) {
      setTimeout(() => {
        setIsLoadingLyrics(true);
        setLyrics({ type: 'loading', data: null });
      }, 0);
      fetch(`/api/lyrics?track=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          if (data.syncedLyrics) {
            setLyrics({ type: 'synced', data: parseLRC(data.syncedLyrics) });
          } else if (data.plainLyrics) {
            setLyrics({ type: 'plain', data: data.plainLyrics });
          } else {
            setLyrics({ type: 'error', data: "Lyrics not found for this track." });
          }
        })
        .catch(() => setLyrics({ type: 'error', data: "Failed to fetch lyrics." }))
        .finally(() => setIsLoadingLyrics(false));
    }
  }, [currentTrack, isLyricsOpen, isRadio]);

  // --- Synced Lyrics: Active Line Tracking ---
  useEffect(() => {
    if (lyrics.type !== 'synced' || !isLyricsOpen) return;
    const audio = audioRef.current;
    const onTimeUpdate = () => {
      const ct = audio.currentTime;
      const lines = lyrics.data;
      let idx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (ct >= lines[i].time) {
          idx = i;
          break;
        }
      }
      setActiveLyricIndex(idx);
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, [lyrics, isLyricsOpen]);

  // --- Synced Lyrics: Auto-scroll ---
  useEffect(() => {
    if (activeLyricIndex < 0 || !lyricsContainerRef.current) return;
    const container = lyricsContainerRef.current;
    const activeLine = container.querySelector(`[data-lyric-index="${activeLyricIndex}"]`);
    if (activeLine) {
      activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex]);

  // --- Lyrics Rendering Helper ---
  const renderLyricsContent = () => {
    if (isLoadingLyrics) {
      return <Loader2 className="animate-spin text-accent" size={32} style={{margin: '80px auto'}} />;
    }
    if (lyrics.type === 'synced') {
      return (
        <div className="synced-lyrics-container" ref={lyricsContainerRef}>
          {lyrics.data.map((line, i) => (
            <div
              key={i}
              data-lyric-index={i}
              className={`synced-lyric-line font-display ${i === activeLyricIndex ? 'active' : ''} ${i < activeLyricIndex ? 'past' : ''}`}
              onClick={() => { audioRef.current.currentTime = line.time; }}
            >
              {line.text}
            </div>
          ))}
        </div>
      );
    }
    if (lyrics.type === 'plain') {
      return <pre className="font-display lyrics-text">{lyrics.data}</pre>;
    }
    if (lyrics.type === 'error') {
      return <pre className="font-display lyrics-text" style={{textAlign: 'center', opacity: 0.5}}>{lyrics.data}</pre>;
    }
    return null;
  };

  const handleAutoplay = async () => {
    if (currentTrack.id === 'default' || !currentTrack.artist) {
      setIsPlaying(false);
      return;
    }
    setIsAutoplaying(true);
    try {
      // Use the artist of the last played track to find similar music
      const similarTracks = await fetchMusicApi(currentTrack.artist);
      const newTracks = similarTracks.filter(t => !currentPlaylist.some(pt => pt.id === t.id));
      if (newTracks.length > 0) {
        setCurrentPlaylist(prev => [...prev, ...newTracks]);
        setOriginalPlaylist(prev => [...prev, ...newTracks]);
        setCurrentTrackIndex(currentPlaylist.length); // Play the first of the newly added tracks
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Autoplay failed:", err);
      setIsPlaying(false);
    } finally {
      setIsAutoplaying(false);
    }
  };

  const handleNext = (overrideRepeatMode = repeatMode) => {
    if (isRadio) return;
    if (currentPlaylist.length > 0) {
      let nextIndex = currentTrackIndex + 1;
      if (nextIndex >= currentPlaylist.length) {
        if (overrideRepeatMode === 0) {
          handleAutoplay();
          return;
        }
        nextIndex = 0; 
      } else {
        setCurrentTrackIndex(nextIndex);
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };

    const handleEnded = () => {
      if (repeatMode === 2) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error(e));
      } else {
        handleNext(repeatMode);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentPlaylist, currentTrackIndex, repeatMode, isRadio]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (currentTrack.id === 'default' || isRadio) return;

    let active = true;

    const loadAndPlay = async () => {
      let url = currentTrack.audioUrl;
      
      // If we don't have the stream URL yet, fetch it
      if (!url) {
        setIsAudioLoading(true);
        try {
          const res = await fetch(`/api/stream?id=${encodeURIComponent(currentTrack.id)}`);
          const data = await res.json();
          if (data.streamUrl && active) {
            url = data.streamUrl;
            // Cache the stream URL on the track object
            currentTrack.audioUrl = url;
          }
        } catch (err) {
          console.error('Error fetching stream URL:', err);
        } finally {
          if (active) setIsAudioLoading(false);
        }
      }

      if (!active || !url) return;

      if (audio.src !== url) {
        audio.src = url;
        setProgress(0);
        setCurrentTime(0);
      }

      if (isPlaying) {
        audio.play().catch(e => console.error("Playback failed:", e));
      } else {
        audio.pause();
      }
    };

    loadAndPlay();

    return () => {
      active = false;
    };
  }, [currentTrack.id, isPlaying, isRadio]);

  const handlePlayTrack = (track, playlist) => {
    setIsRadio(false);
    
    if (isShuffle) {
      const remaining = playlist.filter(t => t.id !== track.id);
      const shuffled = [track, ...[...remaining].sort(() => Math.random() - 0.5)];
      setOriginalPlaylist(playlist);
      setCurrentPlaylist(shuffled);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    } else {
      const index = playlist.findIndex(t => t.id === track.id);
      if (currentTrack.id === track.id && currentPlaylist === playlist) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentPlaylist(playlist);
        setOriginalPlaylist(playlist);
        setCurrentTrackIndex(index !== -1 ? index : 0);
        setIsPlaying(true);
      }
    }
  };

  const handleTogglePlay = () => {
    if (currentTrack.id === DEFAULT_TRACK.id && !isRadio) return;
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    if (isRadio) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else if (currentPlaylist.length > 0) {
      let prevIndex = currentTrackIndex - 1;
      if (prevIndex < 0) prevIndex = currentPlaylist.length - 1;
      setCurrentTrackIndex(prevIndex);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (isRadio || currentTrack.id === DEFAULT_TRACK.id) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    
    if (audioRef.current.duration) {
      audioRef.current.currentTime = clampedRatio * audioRef.current.duration;
      setProgress(clampedRatio);
    }
  };

  const handleVolumeChange = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setVolume(Math.max(0, Math.min(1, ratio)));
  };

  const toggleShuffle = () => {
    if (currentPlaylist.length === 0 || isRadio) return;
    if (isShuffle) {
      setIsShuffle(false);
      setCurrentPlaylist(originalPlaylist);
      const newIndex = originalPlaylist.findIndex(t => t.id === currentTrack.id);
      setCurrentTrackIndex(newIndex !== -1 ? newIndex : 0);
    } else {
      setIsShuffle(true);
      setOriginalPlaylist(currentPlaylist);
      const remaining = currentPlaylist.filter(t => t.id !== currentTrack.id);
      const shuffled = [currentTrack, ...[...remaining].sort(() => Math.random() - 0.5)];
      setCurrentPlaylist(shuffled);
      setCurrentTrackIndex(0);
    }
  };

  const toggleRepeat = () => {
    if (isRadio) return;
    setRepeatMode(prev => (prev + 1) % 3);
  };

  // --- Media Session API ---
  const handleNextRef = useRef(handleNext);
  const handlePrevRef = useRef(handlePrev);
  
  useEffect(() => {
    handleNextRef.current = handleNext;
    handlePrevRef.current = handlePrev;
  });

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
        audioRef.current.play().catch(e => console.error(e));
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
        audioRef.current.pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (handlePrevRef.current) handlePrevRef.current();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (handleNextRef.current) handleNextRef.current();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current) {
          audioRef.current.currentTime = details.seekTime || 0;
        }
      });
    }
  }, []);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title === 'NO TRACK SELECTED' ? 'fuckspotify' : currentTrack.title,
        artist: currentTrack.artist,
        artwork: [
          { src: currentTrack.img, sizes: '512x512', type: 'image/jpeg' },
          { src: currentTrack.img, sizes: '1024x1024', type: 'image/jpeg' }
        ]
      });
    }
  }, [currentTrack]);

  // --- User Storage Actions ---
  const handleToggleFavorite = (track) => {
    setFavorites(prev => {
      const isFav = prev.find(t => t.id === track.id);
      const newFavs = isFav ? prev.filter(t => t.id !== track.id) : [...prev, track];
      localStorage.setItem('fuckspotify_favs', JSON.stringify(newFavs));
      return newFavs;
    });
    setDropdownOpenId(null);
  };

  const handleCreatePlaylist = () => {
    const name = prompt('ENTER PLAYLIST NAME:');
    if (!name || name.trim() === '') return;
    const newPlaylist = {
      id: Date.now().toString(),
      name: name.toUpperCase(),
      tracks: []
    };
    setPlaylists(prev => {
      const updated = [...prev, newPlaylist];
      localStorage.setItem('fuckspotify_playlists', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddToPlaylist = (track, playlistId) => {
    setPlaylists(prev => {
      const updated = prev.map(pl => {
        if (pl.id === playlistId) {
          if (!pl.tracks.find(t => t.id === track.id)) {
            return { ...pl, tracks: [...pl.tracks, track] };
          }
        }
        return pl;
      });
      localStorage.setItem('fuckspotify_playlists', JSON.stringify(updated));
      return updated;
    });
    setDropdownOpenId(null);
  };

  const handleRemoveFromPlaylist = (trackId, playlistId) => {
    setPlaylists(prev => {
      const updated = prev.map(pl => {
        if (pl.id === playlistId) {
          return { ...pl, tracks: pl.tracks.filter(t => t.id !== trackId) };
        }
        return pl;
      });
      localStorage.setItem('fuckspotify_playlists', JSON.stringify(updated));
      return updated;
    });
    setDropdownOpenId(null);
  };

  // --- Views ---
  const renderTrackWidget = (track, contextPlaylist, index = 0, playlistId = null) => {
    const isFav = favorites.find(t => t.id === track.id);
    return (
      <div 
        key={`${track.id}-${index}`} 
        className={`track-widget ${currentTrack.id === track.id ? 'playing' : ''}`}
        onClick={() => handlePlayTrack(track, contextPlaylist)}
      >
        <div className="track-art" style={{backgroundImage: `url(${track.img})`}}></div>
        <div className="track-info">
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.artist}</div>
        </div>
        <div className="track-actions" style={{position: 'relative'}} onClick={(e) => {
          e.stopPropagation();
          setDropdownOpenId(dropdownOpenId === track.id ? null : track.id);
        }}>
          <button className="icon-btn" style={{padding: '4px'}}>
            <MoreHorizontal size={18} className="text-secondary hover:text-primary" />
          </button>
          
          {dropdownOpenId === track.id && (
            <div className="track-dropdown glass-panel shadow-lg" onClick={(e) => e.stopPropagation()}>
              <button className="dropdown-item font-display" onClick={() => handleToggleFavorite(track)}>
                <Heart size={14} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-accent" : ""} /> 
                {isFav ? 'REMOVE FAVORITE' : 'ADD TO FAVORITES'}
              </button>
              <button className="dropdown-item font-display" onClick={() => handlePlayNext(track)}>
                <Play size={14} fill="currentColor" /> PLAY NEXT
              </button>
              <button className="dropdown-item font-display" onClick={() => handleAddToQueue(track)}>
                <ListMusic size={14} /> ADD TO QUEUE
              </button>
              
              {playlists.filter(pl => pl.id !== playlistId).length > 0 && (
                <>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-label text-secondary font-display">ADD TO PLAYLIST</div>
                  {playlists.filter(pl => pl.id !== playlistId).map(pl => (
                    <button key={pl.id} className="dropdown-item font-display" onClick={() => handleAddToPlaylist(track, pl.id)}>
                      <Plus size={14} /> {pl.name}
                    </button>
                  ))}
                </>
              )}

              {playlistId && (
                <>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item font-display text-accent" onClick={() => handleRemoveFromPlaylist(track.id, playlistId)}>
                    <Plus size={14} style={{transform: 'rotate(45deg)'}} /> REMOVE FROM PLAYLIST
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNewView = () => (
    <div className="page-container">
      {isLoadingNew ? (
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '100px'}}><Loader2 className="animate-spin text-accent" size={32} /></div>
      ) : (
        <>
          <section className="hero-widget" style={{'--bg-image': `url(${newTracks[0]?.img || DEFAULT_TRACK.img})`}}>
            <div className="hero-content">
              <div className="hero-subtitle">SYSTEM UPDATE</div>
              <h1 className="hero-title font-display">{newTracks[0]?.title.toUpperCase() || 'LATEST DROPS'}</h1>
              <p className="font-display text-secondary" style={{marginBottom: '24px', letterSpacing: '1px'}}>{newTracks[0]?.artist.toUpperCase() || 'VARIOUS ARTISTS'}</p>
              <div style={{display: 'flex', gap: '16px'}}>
                <button className="btn-primary font-display" onClick={() => handlePlayTrack(newTracks[0], newTracks)}>
                  {(isPlaying && currentTrack.id === newTracks[0]?.id) ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  {(isPlaying && currentTrack.id === newTracks[0]?.id) ? 'PAUSE' : 'PLAY NOW'}
                </button>
              </div>
            </div>
          </section>

          <section>
            <div className="section-header font-display text-secondary">
              BEST NEW SONGS <span className="text-accent">[]</span>
            </div>
            <div className="track-grid">
              {newTracks.slice(1).map((track, i) => renderTrackWidget(track, newTracks, i))}
            </div>
          </section>
        </>
      )}
    </div>
  );

  const renderHomeView = () => (
    <div className="page-container">
      {isLoadingHome ? (
         <div style={{display: 'flex', justifyContent: 'center', marginTop: '100px'}}><Loader2 className="animate-spin text-accent" size={32} /></div>
      ) : (
        <>
          <section>
            <div className="section-header font-display text-secondary">
              RECENTLY PLAYED <span className="text-accent">[]</span>
            </div>
            <div className="track-grid">
              {homeTracks.slice(0, 4).map((track, i) => renderTrackWidget(track, homeTracks, i))}
            </div>
          </section>

          <section>
            <div className="section-header font-display text-secondary" style={{marginTop: '40px'}}>
              TOP PICKS FOR YOU <span className="text-accent">[]</span>
            </div>
            <div className="track-grid">
              {homeTracks.slice(4, 10).map((track, i) => renderTrackWidget(track, homeTracks, i))}
            </div>
          </section>
        </>
      )}
    </div>
  );

  const renderSearchView = () => (
    <div className="page-container">
      <div className="search-container glass-panel">
        <Search size={28} className="text-accent" />
        <input 
          type="text" 
          className="search-input" 
          placeholder="SEARCH..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery ? (
        <section style={{marginTop: '32px'}}>
          <div className="section-header font-display text-secondary">
            RESULTS <span className="text-accent">[]</span>
          </div>
          {isLoadingSearch ? (
            <div style={{display: 'flex', justifyContent: 'center', padding: '40px'}}><Loader2 className="animate-spin text-accent" size={32} /></div>
          ) : searchResults.length > 0 ? (
            <div className="track-grid">
              {searchResults.map((track, i) => renderTrackWidget(track, searchResults, i))}
            </div>
          ) : (
            <p className="text-secondary font-display">NO MATCHES FOUND. TRY ANOTHER QUERY.</p>
          )}
        </section>
      ) : (
        <section>
          <div className="section-header font-display text-secondary" style={{marginTop: '32px'}}>
            BROWSE CATEGORIES <span className="text-accent">[]</span>
          </div>
          <div className="category-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="category-widget" style={{'--bg-image': `url(${cat.img})`}} onClick={() => setSearchQuery(cat.name.toLowerCase())}>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const renderPlaylistDetailView = (playlist) => {
    return (
      <div className="page-container">
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px'}}>
          <button className="icon-btn" onClick={() => setActivePlaylistId(null)} style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            ←
          </button>
          <div>
            <div className="text-secondary font-display" style={{fontSize: '12px', letterSpacing: '1px'}}>PLAYLIST</div>
            <h1 className="font-display" style={{fontSize: '32px', fontWeight: 800}}>{playlist.name}</h1>
            <div className="text-secondary font-display" style={{fontSize: '14px'}}>{playlist.tracks.length} TRACKS</div>
          </div>
        </div>

        <div style={{display: 'flex', gap: '16px', marginBottom: '32px'}}>
          {playlist.tracks.length > 0 && (
            <>
              <button className="btn-primary font-display" onClick={() => handlePlayTrack(playlist.tracks[0], playlist.tracks)}>
                <Play size={18} fill="currentColor" /> PLAY ALL
              </button>
              <button className="btn-primary font-display" style={{backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)'}} onClick={() => {
                const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
                handlePlayTrack(shuffled[0], shuffled);
              }}>
                <Shuffle size={18} /> SHUFFLE
              </button>
            </>
          )}
        </div>

        {playlist.tracks.length > 0 ? (
          <div className="track-grid">
            {playlist.tracks.map((track, i) => renderTrackWidget(track, playlist.tracks, i, playlist.id))}
          </div>
        ) : (
          <p className="text-secondary font-display">THIS PLAYLIST HAS NO TRACKS YET. ADD SOME SONGS FROM SEARCH OR HOME!</p>
        )}
      </div>
    );
  };

  const renderLibraryView = () => {
    if (activePlaylistId) {
      const pl = playlists.find(p => p.id === activePlaylistId);
      if (pl) return renderPlaylistDetailView(pl);
    }

    return (
      <div className="page-container">
        <section>
          <div className="section-header font-display text-secondary">
            FAVORITES <span className="text-accent">[{favorites.length}]</span>
          </div>
          {favorites.length > 0 ? (
            <div className="track-grid">
              {favorites.map((track, i) => renderTrackWidget(track, favorites, i))}
            </div>
          ) : (
            <p className="text-secondary font-display mb-8" style={{marginBottom: '32px'}}>NO FAVORITES YET. HEART SOME TRACKS TO SEE THEM HERE.</p>
          )}
        </section>

        <section style={{marginTop: '40px'}}>
          <div className="section-header font-display text-secondary" style={{justifyContent: 'space-between', borderBottom: 'none'}}>
            <div>MY PLAYLISTS <span className="text-accent">[{playlists.length}]</span></div>
            <button className="btn-primary" style={{padding: '8px 16px', fontSize: '12px'}} onClick={handleCreatePlaylist}>
              <Plus size={14} /> NEW PLAYLIST
            </button>
          </div>
          
          {playlists.length > 0 ? (
            <div className="playlist-grid">
              {playlists.map(pl => (
                <div key={pl.id} className="playlist-widget glass-panel" onClick={() => setActivePlaylistId(pl.id)}>
                  <div className="playlist-art">
                    {pl.tracks.length >= 4 ? (
                      <div className="art-grid">
                        {pl.tracks.slice(0, 4).map((t, i) => (
                          <div key={i} style={{backgroundImage: `url(${t.img})`}}></div>
                        ))}
                      </div>
                    ) : pl.tracks.length > 0 ? (
                      <div className="art-single" style={{backgroundImage: `url(${pl.tracks[0].img})`}}></div>
                    ) : (
                      <div className="art-empty"><Disc size={32} className="text-secondary opacity-50" /></div>
                    )}
                  </div>
                  <div className="playlist-info">
                    <div className="font-display" style={{fontSize: '18px', fontWeight: 700}}>{pl.name}</div>
                    <div className="text-secondary font-display" style={{fontSize: '12px', letterSpacing: '1px'}}>{pl.tracks.length} TRACKS</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary font-display" style={{marginTop: '16px'}}>CREATE A PLAYLIST TO GET STARTED.</p>
          )}
        </section>
      </div>
    );
  };

  const renderRadioView = () => (
    <div className="page-container">
      <div className="section-header font-display text-secondary">
        LIVE BROADCAST <span className="text-accent">[]</span>
      </div>
      <div className="radio-widget">
        {(isPlaying && isRadio) ? (
          <>
            <div className="radio-waves" style={{ animationDelay: '0s' }}></div>
            <div className="radio-waves" style={{ animationDelay: '0.6s' }}></div>
            <div className="radio-waves" style={{ animationDelay: '1.2s' }}></div>
          </>
        ) : null}
        <Mic2 size={64} className={(isPlaying && isRadio) ? "text-accent" : "text-secondary"} style={{zIndex: 2, marginBottom: '24px'}} />
        <h2 className="font-display" style={{zIndex: 2, fontSize: '32px'}}>fuckspotify RADIO 1</h2>
        <p className="text-secondary font-display" style={{zIndex: 2}}>BROADCASTING TO THE WORLD</p>
        
        <button 
          className="btn-primary font-display" 
          style={{zIndex: 2, marginTop: '32px', backgroundColor: (isPlaying && isRadio) ? 'transparent' : '', border: (isPlaying && isRadio) ? '1px solid var(--accent-color)' : ''}}
          onClick={() => {
            if (isPlaying && isRadio) {
              setIsPlaying(false);
              audioRef.current.pause();
            } else {
              setIsRadio(true);
              setCurrentPlaylist([]);
              setCurrentTrackIndex(-1);
              const radioUrl = 'https://icecast2.play.cz/evropa2-128.mp3';
              audioRef.current.src = radioUrl;
              audioRef.current.play();
              setIsPlaying(true);
            }
          }}
        >
          {(isPlaying && isRadio) ? 'STOP BROADCAST' : 'TUNE IN'}
        </button>
      </div>
    </div>
  );

  // Helper calculations
  const totalSegments = 40;
  const activeSegments = isRadio ? 0 : Math.floor(progress * totalSegments);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentDisplayTrack = isRadio ? { title: 'LIVE BROADCAST', artist: 'fuckspotify RADIO 1', img: 'https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?q=80&w=400', time: 'LIVE' } : currentTrack;

  const renderQueueOverlay = () => {
    const upcomingTracks = currentPlaylist.slice(currentTrackIndex + 1);

    return (
      <div className={`mobile-player-expanded glass-panel ${isQueueOpen ? 'open' : ''}`} style={{zIndex: 1000, background: '#0a0a0a'}}>
        <div className="mobile-player-header">
          <button className="icon-btn" onClick={() => setIsQueueOpen(false)}>
            <ChevronDown size={32} />
          </button>
          <div className="font-display" style={{fontSize: '12px', letterSpacing: '2px'}}>UPCOMING IN QUEUE</div>
          <div style={{width: '32px'}}></div>
        </div>

        <div className="queue-list-container" style={{padding: '0 16px', overflowY: 'auto', flex: 1, marginTop: '16px'}}>
          {upcomingTracks.length > 0 ? (
            <div className="track-grid" style={{gridTemplateColumns: '1fr', paddingBottom: '100px'}}>
              {upcomingTracks.map((track, i) => renderTrackWidget(track, currentPlaylist, i + currentTrackIndex + 1))}
            </div>
          ) : (
            <div className="font-display text-secondary" style={{textAlign: 'center', marginTop: '60px', letterSpacing: '1px'}}>
              {isAutoplaying ? (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'}}>
                  <Loader2 className="animate-spin text-accent mx-auto" size={32} />
                  <span style={{fontSize: '10px', opacity: 0.6}}>AUTOPLAYING SIMILAR MUSIC...</span>
                </div>
              ) : (
                <>QUEUE IS EMPTY<br/><br/><span style={{fontSize: '10px', opacity: 0.6}}>AUTOPLAY WILL PLAY SIMILAR MUSIC</span></>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Vinyl Spin Animation ---
  useEffect(() => {
    const spinVinyl = (timestamp) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (isPlaying && !isScratchingRef.current) {
        // 33⅓ RPM = 0.556 rev/sec = 200°/sec
        vinylAngleRef.current += (delta / 1000) * 200;
      }

      if (vinylRef.current) {
        vinylRef.current.style.transform = `rotate(${vinylAngleRef.current}deg)`;
      }
      vinylAnimRef.current = requestAnimationFrame(spinVinyl);
    };

    vinylAnimRef.current = requestAnimationFrame(spinVinyl);
    return () => {
      if (vinylAnimRef.current) cancelAnimationFrame(vinylAnimRef.current);
    };
  }, [isPlaying]);

  // --- Vinyl Touch/Mouse Scrub Handlers ---
  const getAngleFromEvent = useCallback((clientX, clientY) => {
    if (!vinylRef.current) return 0;
    const rect = vinylRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const handleVinylTouchStart = useCallback((e) => {
    if (isRadio) return;
    const touch = e.touches[0];
    isScratchingRef.current = true;
    scratchStartAngleRef.current = getAngleFromEvent(touch.clientX, touch.clientY);
    scratchStartTimeRef.current = audioRef.current.currentTime;
    setIsScrubbing(true);
  }, [isRadio, getAngleFromEvent]);

  const handleVinylTouchMove = useCallback((e) => {
    if (!isScratchingRef.current || isRadio) return;
    const touch = e.touches[0];
    const currentAngle = getAngleFromEvent(touch.clientX, touch.clientY);
    let delta = currentAngle - scratchStartAngleRef.current;

    // Normalize to -180..180
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    vinylAngleRef.current += delta;
    scratchStartAngleRef.current = currentAngle;

    // Map rotation to time: 360° = ~10 seconds of track
    const audio = audioRef.current;
    const timeDelta = (delta / 360) * 10;
    const newTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + timeDelta));
    audio.currentTime = newTime;
  }, [isRadio, getAngleFromEvent]);

  const handleVinylTouchEnd = useCallback(() => {
    isScratchingRef.current = false;
    setIsScrubbing(false);
  }, []);

  const handleVinylMouseDown = useCallback((e) => {
    if (isRadio) return;
    isScratchingRef.current = true;
    scratchStartAngleRef.current = getAngleFromEvent(e.clientX, e.clientY);
    scratchStartTimeRef.current = audioRef.current.currentTime;
    setIsScrubbing(true);

    const handleMouseMove = (ev) => {
      if (!isScratchingRef.current) return;
      const currentAngle = getAngleFromEvent(ev.clientX, ev.clientY);
      let delta = currentAngle - scratchStartAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      vinylAngleRef.current += delta;
      scratchStartAngleRef.current = currentAngle;

      const audio = audioRef.current;
      const timeDelta = (delta / 360) * 10;
      const newTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + timeDelta));
      audio.currentTime = newTime;
    };

    const handleMouseUp = () => {
      isScratchingRef.current = false;
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isRadio, getAngleFromEvent]);

  const renderExpandedMobilePlayer = () => {
    return (
      <div className={`mobile-player-expanded glass-panel ${isMobilePlayerOpen ? 'open' : ''}`} style={{'--dominant-bg': `url(${currentDisplayTrack.img})`}}>
        <div className="mobile-player-header">
          <button className="icon-btn" onClick={() => setIsMobilePlayerOpen(false)}>
            <ChevronDown size={32} />
          </button>
          <div className="font-display" style={{fontSize: '12px', letterSpacing: '2px'}}>{isRadio ? 'PLAYING RADIO' : 'NOW PLAYING'}</div>
          <div style={{display: 'flex', gap: '8px'}}>
            <button className={`icon-btn ${isQueueOpen ? 'text-accent' : ''}`} onClick={() => setIsQueueOpen(!isQueueOpen)}>
              <ListMusic size={24} />
            </button>
            <button className={`icon-btn ${isLyricsOpen ? 'text-accent' : ''}`} onClick={() => setIsLyricsOpen(!isLyricsOpen)}>
              <MessageCircle size={24} />
            </button>
          </div>
        </div>

        {isLyricsOpen ? (
          <div className="mobile-lyrics-pane">
            {renderLyricsContent()}
          </div>
        ) : (
          <div className="mobile-album-container">
            <div
              className={`vinyl-widget ${isPlaying && !isScrubbing ? 'spinning' : ''}`}
              ref={vinylRef}
              onTouchStart={handleVinylTouchStart}
              onTouchMove={handleVinylTouchMove}
              onTouchEnd={handleVinylTouchEnd}
              onMouseDown={handleVinylMouseDown}
            >
              <div className="vinyl-grooves">
                <div className="vinyl-groove" style={{width:'92%',height:'92%'}} />
                <div className="vinyl-groove" style={{width:'80%',height:'80%'}} />
                <div className="vinyl-groove" style={{width:'68%',height:'68%'}} />
              </div>
              <div className="vinyl-label">
                <img src={currentDisplayTrack.img} alt="album art" className="vinyl-label-art" />
              </div>
              <div className="vinyl-center-dot" />
              {isScrubbing && <div className="vinyl-scrub-indicator font-display">SCRUBBING</div>}
            </div>
          </div>
        )}

        <div className="mobile-track-info">
          <div style={{flex: 1, overflow: 'hidden'}}>
            <div className="mobile-track-title font-display text-primary">{currentDisplayTrack.title}</div>
            <div className="mobile-track-artist font-display text-secondary">{currentDisplayTrack.artist}</div>
          </div>
          <div style={{display: 'flex', gap: '8px', position: 'relative'}}>
            <button className="icon-btn" onClick={() => {
              if(currentDisplayTrack.id !== 'default') handleToggleFavorite(currentDisplayTrack);
            }}>
              <Heart size={28} fill={favorites.find(t => t.id === currentDisplayTrack.id) ? "currentColor" : "none"} className={favorites.find(t => t.id === currentDisplayTrack.id) ? "text-accent" : "text-secondary"} />
            </button>
            <button className="icon-btn" onClick={() => setDropdownOpenId(dropdownOpenId === 'player' ? null : 'player')}>
              <MoreHorizontal size={28} className="text-secondary hover:text-primary" />
            </button>

            {dropdownOpenId === 'player' && (
              <div className="track-dropdown glass-panel shadow-lg" style={{bottom: '40px', right: '0', top: 'auto', minWidth: '200px'}}>
                <button className="dropdown-item font-display" onClick={() => handleToggleFavorite(currentDisplayTrack)}>
                  <Heart size={14} fill={favorites.find(t => t.id === currentDisplayTrack.id) ? "currentColor" : "none"} className={favorites.find(t => t.id === currentDisplayTrack.id) ? "text-accent" : ""} /> 
                  {favorites.find(t => t.id === currentDisplayTrack.id) ? 'REMOVE FAVORITE' : 'ADD TO FAVORITES'}
                </button>
                <button className="dropdown-item font-display" onClick={() => handlePlayNext(currentDisplayTrack)}>
                  <Play size={14} fill="currentColor" /> PLAY NEXT
                </button>
                <button className="dropdown-item font-display" onClick={() => handleAddToQueue(currentDisplayTrack)}>
                  <ListMusic size={14} /> ADD TO QUEUE
                </button>
                
                {playlists.length > 0 && (
                  <>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-label text-secondary font-display">ADD TO PLAYLIST</div>
                    {playlists.map(pl => (
                      <button key={pl.id} className="dropdown-item font-display" onClick={() => handleAddToPlaylist(currentDisplayTrack, pl.id)}>
                        <Plus size={14} /> {pl.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mobile-progress">
          <div className="led-progress-bar" onClick={handleSeek} style={{cursor: isRadio ? 'default' : 'pointer', height: '12px'}}>
            {[...Array(totalSegments)].map((_, i) => (
              <div 
                key={i} 
                className={`led-segment ${i < activeSegments ? 'active' : ''} ${i === activeSegments && isPlaying ? 'dim' : ''}`}
                style={{borderRadius: '2px'}}
              ></div>
            ))}
          </div>
          <div className="mobile-time-row">
            <span>{formatTime(currentTime)}</span>
            <span>{currentDisplayTrack.time}</span>
          </div>
        </div>

        <div className="mobile-controls">
          <button className={`icon-btn ${isShuffle ? 'text-accent' : ''}`} onClick={toggleShuffle}>
            <Shuffle size={24} />
          </button>
          <button className="icon-btn" onClick={handlePrev}>
            <SkipBack size={40} fill="currentColor" />
          </button>
          <button className="play-btn-large" onClick={handleTogglePlay}>
            {isAudioLoading ? <Loader2 className="animate-spin text-accent" size={36} /> : (isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />)}
          </button>
          <button className="icon-btn" onClick={handleNext}>
            <SkipForward size={40} fill="currentColor" />
          </button>
          <button className={`icon-btn ${repeatMode > 0 ? 'text-accent' : ''}`} onClick={toggleRepeat}>
            {repeatMode === 2 ? <Repeat1 size={24} /> : <Repeat size={24} />}
          </button>
        </div>

        <div className="mobile-volume">
          <Volume2 size={20} className="text-secondary" />
          <div className="volume-bar" onClick={handleVolumeChange} style={{cursor: 'pointer', height: '8px', flex: 1, marginLeft: '16px'}}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`volume-segment ${(i / 12) <= volume ? 'active' : ''}`} style={{borderRadius: '2px'}}></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`app-container ${isMobile ? 'is-mobile' : ''}`}>
      {showInstallPrompt && (
        <div className="pwa-install-banner glass-panel shadow-glow">
          <div className="pwa-banner-content">
            <div className="pwa-icon">
              <Download size={24} className="text-accent" />
            </div>
            <div className="pwa-text">
              <div className="font-display" style={{fontSize: '14px'}}>INSTALL FUCKSPOTIFY</div>
              <div className="font-display" style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)'}}>ADD TO HOME SCREEN FOR FULL EXPERIENCE</div>
            </div>
          </div>
          <div className="pwa-actions">
            <button className="btn-primary font-display" style={{padding: '6px 12px', fontSize: '12px'}} onClick={handleInstallPwa}>INSTALL</button>
            <button className="icon-btn text-secondary hover:text-primary" onClick={handleDismissPwa}><X size={20} /></button>
          </div>
        </div>
      )}

      {showIOSInstallPrompt && (
        <div className="pwa-install-banner glass-panel shadow-glow ios-prompt" style={{top: 'auto', bottom: '80px', left: '16px', right: '16px'}}>
          <div className="pwa-banner-content">
            <div className="pwa-icon">
              <Share size={24} className="text-accent" />
            </div>
            <div className="pwa-text">
              <div className="font-display" style={{fontSize: '14px'}}>INSTALL FUCKSPOTIFY</div>
              <div className="font-display" style={{fontSize: '11px', color: 'rgba(255,255,255,0.7)'}}>TAP SHARE BUTTON <span style={{display: 'inline-block', transform: 'translateY(2px)'}}><Share size={12} /></span> AND SELECT 'ADD TO HOME SCREEN'</div>
            </div>
          </div>
          <div className="pwa-actions">
            <button className="icon-btn text-secondary hover:text-primary" onClick={handleDismissIOSPwa}><X size={20} /></button>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-logo font-display">
          <Disc size={28} className="text-accent" />
          fuckspotify
        </div>
        
        <nav className="sidebar-nav">
          <div className="font-display text-secondary" style={{fontSize: '12px', marginTop: '16px', marginBottom: '8px'}}>SYSTEM</div>
          <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
            <Search size={18} /> SEARCH
          </button>
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Home size={18} /> HOME
          </button>
          <button className={`nav-item ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>
            <Compass size={18} /> NEW
          </button>
          <button className={`nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
            <Library size={18} /> LIBRARY
          </button>
          <button className={`nav-item ${activeTab === 'radio' ? 'active' : ''}`} onClick={() => setActiveTab('radio')}>
            <Radio size={18} /> RADIO
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {activeTab === 'new' && renderNewView()}
        {activeTab === 'home' && renderHomeView()}
        {activeTab === 'search' && renderSearchView()}
        {activeTab === 'library' && renderLibraryView()}
        {activeTab === 'radio' && renderRadioView()}
      </main>

      {/* Global Bottom Player */}
      <div className="player-bar glass-panel" onClick={(e) => {
        if (isMobile && e.target.closest('.player-bar')) {
          if (e.target.closest('button')) return;
          setIsMobilePlayerOpen(true);
        }
      }}>
        <div className="player-track-info" onClick={() => { if(isMobile) setIsMobilePlayerOpen(true); }}>
          <div className="track-art shadow-sm" style={{backgroundImage: `url(${currentDisplayTrack.img})`, filter: isPlaying ? 'grayscale(0)' : ''}}></div>
          <div>
            <div className="font-display text-accent" style={{fontSize: '14px', marginBottom: '2px', letterSpacing: '1px'}}>{currentDisplayTrack.title}</div>
            <div className="font-display text-secondary" style={{fontSize: '12px'}}>{currentDisplayTrack.artist}</div>
          </div>
        </div>

        <div className="player-controls desktop-only">
          <div className="player-buttons">
            <button className={`player-btn ${isShuffle ? 'text-accent' : ''}`} onClick={toggleShuffle}><Shuffle size={18} /></button>
            <button className="player-btn" onClick={handlePrev}><SkipBack size={20} fill="currentColor" /></button>
            <button className="play-btn" onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}>
              {isAudioLoading ? <Loader2 className="animate-spin" size={20} /> : (isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />)}
            </button>
            <button className="player-btn" onClick={handleNext}><SkipForward size={20} fill="currentColor" /></button>
            <button className={`player-btn ${repeatMode > 0 ? 'text-accent' : ''}`} onClick={toggleRepeat}>
              {repeatMode === 2 ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
            <button className={`player-btn ${isQueueOpen ? 'text-accent' : ''}`} onClick={() => setIsQueueOpen(!isQueueOpen)}>
              <ListMusic size={18} />
            </button>
            <button className={`player-btn ${isLyricsOpen ? 'text-accent' : ''}`} onClick={() => setIsLyricsOpen(!isLyricsOpen)}>
              <MessageCircle size={18} />
            </button>
          </div>
          <div className="progress-container">
            <span style={{width: '32px', textAlign: 'right', opacity: isRadio ? 0 : 1}}>
              {formatTime(currentTime)}
            </span>
            <div className="led-progress-bar" onClick={handleSeek} style={{cursor: isRadio ? 'default' : 'pointer'}}>
              {[...Array(totalSegments)].map((_, i) => (
                <div 
                  key={i} 
                  className={`led-segment ${i < activeSegments ? 'active' : ''} ${i === activeSegments && isPlaying ? 'dim' : ''}`}
                ></div>
              ))}
            </div>
            <span style={{width: '32px', opacity: isRadio ? 0 : 1}}>{currentDisplayTrack.time}</span>
          </div>
        </div>

        <div className="player-volume desktop-only">
          <Volume2 size={16} className="text-secondary" />
          <div className="volume-bar" onClick={handleVolumeChange} style={{cursor: 'pointer'}}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`volume-segment ${(i / 12) <= volume ? 'active' : ''}`}></div>
            ))}
          </div>
        </div>

        {/* Mobile quick controls on mini player */}
        <div className="mobile-only-flex" style={{display: isMobile ? 'flex' : 'none', gap: '16px', alignItems: 'center'}}>
          <button className="player-btn" onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}>
            {isAudioLoading ? <Loader2 className="animate-spin text-accent" size={24} /> : (isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />)}
          </button>
        </div>
      </div>

      <div className="mobile-tab-bar glass-panel">
        <button className={`nav-item text-secondary ${activeTab === 'home' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('home')}>
          <Home size={24} />
        </button>
        <button className={`nav-item text-secondary ${activeTab === 'new' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('new')}>
          <Compass size={24} />
        </button>
        <button className={`nav-item text-secondary ${activeTab === 'library' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('library')}>
          <Library size={24} />
        </button>
        <button className={`nav-item text-secondary ${activeTab === 'search' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('search')}>
          <Search size={24} />
        </button>
      </div>

      {renderExpandedMobilePlayer()}
      {renderQueueOverlay()}
    </div>
  );
}

export default App;
