import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, ListMusic, MessageCircle, Loader2 } from 'lucide-react';
import { usePlayer } from '../../store/PlayerContext';
import { useUI } from '../../store/UIContext';

export const GlobalPlayer = () => {
  const { 
    currentTrack, isPlaying, isAudioLoading, currentTime, volume,
    isShuffle, repeatMode, audioError, isRadio,
    handleTogglePlay, handleNext, handlePrev, handleSeek,
    handleVolumeChange, toggleShuffle, toggleRepeat
  } = usePlayer();

  const { isMobile, setIsMobilePlayerOpen, isQueueOpen, setIsQueueOpen, isLyricsOpen, setIsLyricsOpen } = useUI();

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentDisplayTrack = isRadio 
    ? { title: 'LIVE BROADCAST', artist: 'fuckspotify RADIO 1', img: 'https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?q=80&w=400', time: 'LIVE' } 
    : currentTrack;

  const totalSegments = 40;
  // Fallback to a simple percentage based segment count, assuming duration is mostly unknown unless loaded
  // Alternatively we can use 0 to 40 based on percentage of (currentTime / duration)
  // Wait, currentTrack has a .time property (string "3:45"). We can parse it.
  const parseTimeStringToSeconds = (timeStr) => {
    if (!timeStr || timeStr === 'LIVE') return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    return 0;
  };

  const durationSec = parseTimeStringToSeconds(currentDisplayTrack.time) || 0;
  const progress = durationSec > 0 ? (currentTime / durationSec) : 0;
  const activeSegments = isRadio ? 0 : Math.floor(progress * totalSegments);

  const handleSeekClick = (e) => {
    if (isRadio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    handleSeek(percent * durationSec);
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    handleVolumeChange(percent);
  };

  return (
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
          {audioError && <div className="player-error font-display">{audioError}</div>}
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
          <div className="led-progress-bar" onClick={handleSeekClick} style={{cursor: isRadio ? 'default' : 'pointer'}}>
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
        <div className="volume-bar" onClick={handleVolumeClick} style={{cursor: 'pointer'}}>
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
  );
};
