import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Home, Radio, Compass, Disc, 
  Play, Pause, SkipBack, SkipForward, 
  Shuffle, Repeat, Repeat1, Volume2, MoreHorizontal, Heart, Mic2, Loader2, ChevronDown, MessageCircle
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

const mapITunesTrack = (item) => ({
  id: item.trackId,
  title: item.trackName,
  artist: item.artistName,
  img: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '400x400bb') : 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=400',
  audioUrl: item.previewUrl,
  time: '0:30' // iTunes previews are exactly 30s
});

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
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [originalPlaylist, setOriginalPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [currentTime, setCurrentTime] = useState(0); 
  const [volume, setVolume] = useState(0.8);
  const [isRadio, setIsRadio] = useState(false);
  
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0 = off, 1 = all, 2 = one
  
  // Mobile UI States
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // Refs
  const audioRef = useRef(new Audio());
  const searchTimeoutRef = useRef(null);

  const currentTrack = currentTrackIndex >= 0 && currentPlaylist[currentTrackIndex] 
    ? currentPlaylist[currentTrackIndex] 
    : DEFAULT_TRACK;

  // --- API Fetching ---
  const fetchMusicApi = async (query) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('Error fetching music:', err);
      return [];
    }
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
      setSearchResults([]);
      return;
    }
    setIsLoadingSearch(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchMusicApi(searchQuery).then(tracks => {
        setSearchResults(tracks);
        setIsLoadingSearch(false);
      });
    }, 500);
  }, [searchQuery]);

  // --- Lyrics Fetching ---
  useEffect(() => {
    if (isLyricsOpen && currentTrack.id !== 'default' && !isRadio) {
      setIsLoadingLyrics(true);
      setLyrics('');
      fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(currentTrack.artist)}/${encodeURIComponent(currentTrack.title)}`)
        .then(res => res.json())
        .then(data => {
          if (data.lyrics) setLyrics(data.lyrics);
          else setLyrics("Lyrics not found for this track.");
        })
        .catch(() => setLyrics("Failed to fetch lyrics."))
        .finally(() => setIsLoadingLyrics(false));
    }
  }, [currentTrack, isLyricsOpen, isRadio]);

  // --- Audio Logic ---
  const handleNext = (overrideRepeatMode = repeatMode) => {
    if (isRadio) return;
    if (currentPlaylist.length > 0) {
      let nextIndex = currentTrackIndex + 1;
      if (nextIndex >= currentPlaylist.length) {
        if (overrideRepeatMode === 0) {
          setIsPlaying(false);
          return;
        }
        nextIndex = 0; 
      }
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(true);
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
    if (currentTrack.audioUrl) {
      if (audio.src !== currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
        setProgress(0);
        setCurrentTime(0);
      }
      if (isPlaying) {
        audio.play().catch(e => console.error("Playback failed:", e));
      } else {
        audio.pause();
      }
    }
  }, [currentTrack, isPlaying]);

  // --- Controls ---
  const handlePlayTrack = async (track, playlist) => {
    setIsRadio(false);
    
    // Fetch stream URL from our backend
    const API_BASE = import.meta.env.VITE_API_URL || '';
    try {
      const res = await fetch(`${API_BASE}/api/stream?id=${encodeURIComponent(track.id)}`);
      const data = await res.json();
      if (data.streamUrl) {
        track.audioUrl = data.streamUrl;
      }
    } catch (err) {
      console.error('Error fetching stream URL:', err);
    }
    
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
        setCurrentTrackIndex(index);
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

  // --- Views ---
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
              {newTracks.slice(1).map((track) => (
                <div 
                  key={track.id} 
                  className={`track-widget ${currentTrack.id === track.id ? 'playing' : ''}`}
                  onClick={() => handlePlayTrack(track, newTracks)}
                >
                  <div className="track-art" style={{backgroundImage: `url(${track.img})`}}></div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                  <div style={{color: 'var(--text-secondary)'}}>
                    <MoreHorizontal size={18} />
                  </div>
                </div>
              ))}
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
              {homeTracks.slice(0, 4).map((track) => (
                <div 
                  key={track.id} 
                  className={`track-widget ${currentTrack.id === track.id ? 'playing' : ''}`}
                  onClick={() => handlePlayTrack(track, homeTracks)}
                >
                  <div className="track-art" style={{backgroundImage: `url(${track.img})`}}></div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                  <div style={{color: 'var(--text-secondary)'}}>
                    <MoreHorizontal size={18} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="section-header font-display text-secondary" style={{marginTop: '40px'}}>
              TOP PICKS FOR YOU <span className="text-accent">[]</span>
            </div>
            <div className="track-grid">
              {homeTracks.slice(4, 10).map((track) => (
                <div 
                  key={track.id} 
                  className={`track-widget ${currentTrack.id === track.id ? 'playing' : ''}`}
                  onClick={() => handlePlayTrack(track, homeTracks)}
                >
                  <div className="track-art" style={{backgroundImage: `url(${track.img})`}}></div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                  <div style={{color: 'var(--text-secondary)'}}>
                    <MoreHorizontal size={18} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );

  const renderSearchView = () => (
    <div className="page-container">
      <div className="search-container">
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
              {searchResults.map((track) => (
                <div 
                  key={track.id} 
                  className={`track-widget ${currentTrack.id === track.id ? 'playing' : ''}`}
                  onClick={() => handlePlayTrack(track, searchResults)}
                >
                  <div className="track-art" style={{backgroundImage: `url(${track.img})`}}></div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                  <div style={{color: 'var(--text-secondary)'}}>
                    <MoreHorizontal size={18} />
                  </div>
                </div>
              ))}
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
  const activeSegments = isRadio ? Math.floor((Date.now() / 100) % totalSegments) : Math.floor(progress * totalSegments);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentDisplayTrack = isRadio ? { title: 'LIVE BROADCAST', artist: 'fuckspotify RADIO 1', img: 'https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?q=80&w=400', time: 'LIVE' } : currentTrack;

  const renderExpandedMobilePlayer = () => {
    return (
      <div className={`mobile-player-expanded glass-panel ${isMobilePlayerOpen ? 'open' : ''}`} style={{'--dominant-bg': `url(${currentDisplayTrack.img})`}}>
        <div className="mobile-player-header">
          <button className="icon-btn" onClick={() => setIsMobilePlayerOpen(false)}>
            <ChevronDown size={32} />
          </button>
          <div className="font-display" style={{fontSize: '12px', letterSpacing: '2px'}}>{isRadio ? 'PLAYING RADIO' : 'NOW PLAYING'}</div>
          <button className={`icon-btn ${isLyricsOpen ? 'text-accent' : ''}`} onClick={() => setIsLyricsOpen(!isLyricsOpen)}>
            <MessageCircle size={24} />
          </button>
        </div>

        {isLyricsOpen ? (
          <div className="mobile-lyrics-pane">
            {isLoadingLyrics ? (
              <Loader2 className="animate-spin text-accent mx-auto mt-20" size={32} />
            ) : (
              <pre className="font-display lyrics-text">{lyrics}</pre>
            )}
          </div>
        ) : (
          <div className="mobile-album-container">
            <img src={currentDisplayTrack.img} alt="album art" className="mobile-album-art shadow-glow" />
          </div>
        )}

        <div className="mobile-track-info">
          <div>
            <div className="mobile-track-title font-display text-primary">{currentDisplayTrack.title}</div>
            <div className="mobile-track-artist font-display text-secondary">{currentDisplayTrack.artist}</div>
          </div>
          <Heart size={28} className="text-secondary" />
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
            {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
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
    <div className="app-container">
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
          <button className={`nav-item ${activeTab === 'radio' ? 'active' : ''}`} onClick={() => setActiveTab('radio')}>
            <Radio size={18} /> RADIO
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {activeTab === 'new' && renderNewView()}
        {activeTab === 'home' && renderHomeView()}
        {activeTab === 'search' && renderSearchView()}
        {activeTab === 'radio' && renderRadioView()}
      </main>

      {/* Global Bottom Player */}
      <div className="player-bar glass-panel" onClick={(e) => {
        if (window.innerWidth <= 768 && e.target.closest('.player-bar')) {
          if (e.target.closest('button')) return;
          setIsMobilePlayerOpen(true);
        }
      }}>
        <div className="player-track-info" onClick={() => { if(window.innerWidth <= 768) setIsMobilePlayerOpen(true); }}>
          <div className="track-art shadow-sm" style={{margin: 0, backgroundImage: `url(${currentDisplayTrack.img})`, filter: isPlaying ? 'grayscale(0)' : ''}}></div>
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
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button className="player-btn" onClick={handleNext}><SkipForward size={20} fill="currentColor" /></button>
            <button className={`player-btn ${repeatMode > 0 ? 'text-accent' : ''}`} onClick={toggleRepeat}>
              {repeatMode === 2 ? <Repeat1 size={18} /> : <Repeat size={18} />}
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
        <div className="mobile-only-flex" style={{display: window.innerWidth <= 768 ? 'flex' : 'none', gap: '16px', alignItems: 'center'}}>
          <button className="player-btn" onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}>
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
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
        <button className={`nav-item text-secondary ${activeTab === 'radio' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('radio')}>
          <Radio size={24} />
        </button>
        <button className={`nav-item text-secondary ${activeTab === 'search' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('search')}>
          <Search size={24} />
        </button>
      </div>

      {renderExpandedMobilePlayer()}
    </div>
  );
}

export default App;
