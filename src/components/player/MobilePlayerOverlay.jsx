import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ListMusic, MessageCircle, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Heart, MoreHorizontal, Loader2, Plus } from 'lucide-react';
import { usePlayer } from '../../store/PlayerContext';
import { useUI } from '../../store/UIContext';

export const MobilePlayerOverlay = () => {
  const { 
    currentTrack, isPlaying, isAudioLoading, currentTime, volume,
    isShuffle, repeatMode, audioError, isRadio,
    favorites, playlists,
    handleTogglePlay, handleNext, handlePrev, handleSeek,
    handleVolumeChange, toggleShuffle, toggleRepeat,
    toggleFavorite, addToPlaylist, addToQueue
  } = usePlayer();

  const { isMobilePlayerOpen, setIsMobilePlayerOpen, isQueueOpen, setIsQueueOpen, isLyricsOpen, setIsLyricsOpen } = useUI();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentDisplayTrack = isRadio 
    ? { id: 'radio', title: 'LIVE BROADCAST', artist: 'fuckspotify RADIO 1', img: 'https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?q=80&w=400', time: 'LIVE' } 
    : currentTrack;

  const isFav = favorites.some(t => t.id === currentDisplayTrack.id);

  const parseTimeStringToSeconds = (timeStr) => {
    if (!timeStr || timeStr === 'LIVE') return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    return 0;
  };

  const durationSec = parseTimeStringToSeconds(currentDisplayTrack.time) || 0;
  const progress = durationSec > 0 ? (currentTime / durationSec) : 0;
  const totalSegments = 40;
  const activeSegments = isRadio ? 0 : Math.floor(progress * totalSegments);

  const vinylRef = useRef(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let animationFrame;
    if (isPlaying && !isScrubbing) {
      const animate = () => {
        setRotation(prev => (prev + 0.5) % 360);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, isScrubbing]);

  const getAngleFromEvent = (e) => {
    if (!vinylRef.current) return 0;
    const rect = vinylRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const handleVinylStart = (e) => {
    setIsScrubbing(true);
  };

  const handleVinylMove = (e) => {
    if (!isScrubbing || isRadio || durationSec === 0) return;
    const angle = getAngleFromEvent(e);
    setRotation(angle);
    // Simple visual scrub mapping (could be mapped to actual duration but let's just use angle delta if we wanted to be complex. For now, it's just visual)
  };

  const handleVinylEnd = () => {
    setIsScrubbing(false);
  };

  const handleSeekClick = (e) => {
    if (isRadio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    handleSeek(percent * durationSec);
  };

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

      <div className="mobile-album-container">
        <div 
          className={`vinyl-widget ${isPlaying && !isScrubbing ? 'spinning' : ''}`} 
          style={{ transform: `rotate(${rotation}deg)`, transition: isScrubbing ? 'none' : 'transform 0.1s linear' }}
          ref={vinylRef}
          onTouchStart={handleVinylStart}
          onTouchMove={handleVinylMove}
          onTouchEnd={handleVinylEnd}
          onMouseDown={handleVinylStart}
          onMouseMove={handleVinylMove}
          onMouseUp={handleVinylEnd}
          onMouseLeave={handleVinylEnd}
        >
          <div className="vinyl-grooves">
            <div className="vinyl-groove" style={{width:'92%',height:'92%'}} />
            <div className="vinyl-groove" style={{width:'80%',height:'80%'}} />
            <div className="vinyl-groove" style={{width:'68%',height:'68%'}} />
          </div>
          <div className="vinyl-label" style={{ transform: `rotate(${-rotation}deg)` }}>
            <img src={currentDisplayTrack.img} alt="album art" className="vinyl-label-art" />
          </div>
          <div className="vinyl-center-dot" />
        </div>
      </div>

      <div className="mobile-track-info">
        <div style={{flex: 1, overflow: 'hidden'}}>
          <div className="mobile-track-title font-display text-primary">{currentDisplayTrack.title}</div>
          <div className="mobile-track-artist font-display text-secondary">{currentDisplayTrack.artist}</div>
          {audioError && <div className="player-error font-display">{audioError}</div>}
        </div>
        <div style={{display: 'flex', gap: '8px', position: 'relative'}}>
          <button className="icon-btn" onClick={() => {
            if(currentDisplayTrack.id !== 'default' && currentDisplayTrack.id !== 'radio') toggleFavorite(currentDisplayTrack);
          }}>
            <Heart size={28} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-accent" : "text-secondary"} />
          </button>
          <button className="icon-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <MoreHorizontal size={28} className="text-secondary hover:text-primary" />
          </button>

          {dropdownOpen && (
            <div className="track-dropdown glass-panel shadow-lg" style={{bottom: '40px', right: '0', top: 'auto', minWidth: '200px'}}>
              <button className="dropdown-item font-display" onClick={() => { toggleFavorite(currentDisplayTrack); setDropdownOpen(false); }}>
                <Heart size={14} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-accent" : ""} /> 
                {isFav ? 'REMOVE FAVORITE' : 'ADD TO FAVORITES'}
              </button>
              <button className="dropdown-item font-display" onClick={() => { addToQueue(currentDisplayTrack); setDropdownOpen(false); }}>
                <ListMusic size={14} /> ADD TO QUEUE
              </button>
              
              {playlists.length > 0 && (
                <>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-label text-secondary font-display">ADD TO PLAYLIST</div>
                  {playlists.map(pl => (
                    <button key={pl.id} className="dropdown-item font-display" onClick={() => { addToPlaylist(pl.id, currentDisplayTrack); setDropdownOpen(false); }}>
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
        <div className="led-progress-bar" onClick={handleSeekClick} style={{cursor: isRadio ? 'default' : 'pointer', height: '12px'}}>
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
        <input 
          type="range" 
          className="volume-slider" 
          style={{ flex: 1, marginLeft: '16px' }}
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} 
        />
      </div>
    </div>
  );
};
