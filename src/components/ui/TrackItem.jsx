import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Heart, Plus, ListMusic, Download } from 'lucide-react';
import { usePlayer } from '../../store/PlayerContext';

export const TrackItem = ({ track, contextPlaylist, showArt = true, isPlayingContext = false }) => {
  const { currentTrack, handlePlayTrack, toggleFavorite, favorites, addToQueue } = usePlayer();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isFav = favorites.some(f => f.id === track.id);
  const isPlaying = currentTrack.id === track.id;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className={`track-widget ${isPlaying ? 'playing' : ''}`}>
      <button className="track-primary-action" onClick={() => handlePlayTrack(track, contextPlaylist)} aria-label={`Play ${track.title} by ${track.artist}`}>
        {showArt && <div className="track-art" style={{backgroundImage: `url(${track.img})`}}></div>}
        <div className="track-info">
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.artist}</div>
        </div>
      </button>
      
      <div className="track-actions" style={{position: 'relative'}} ref={dropdownRef}>
        <button 
          className="icon-btn text-secondary hover:text-primary" 
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
        >
          <MoreHorizontal size={20} />
        </button>
        
        {dropdownOpen && (
          <div className="track-dropdown glass-panel shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-label text-secondary font-display">ACTIONS</div>
            <button className="dropdown-item" onClick={() => { toggleFavorite(track); setDropdownOpen(false); }}>
              <Heart size={16} className={isFav ? "text-accent" : ""} fill={isFav ? "currentColor" : "none"} /> 
              {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            <button className="dropdown-item" onClick={() => { addToQueue(track); setDropdownOpen(false); }}>
              <ListMusic size={16} /> Add to Queue
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" onClick={() => {
              const url = track.audioUrl || `/api/audio?id=${encodeURIComponent(track.id)}`;
              const a = document.createElement('a');
              a.href = url;
              a.download = `${track.title} - ${track.artist}.m4a`;
              a.click();
              setDropdownOpen(false);
            }}>
              <Download size={16} /> Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
