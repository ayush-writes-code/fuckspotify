import React, { useState, useEffect } from 'react';
import { Loader2, Play } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { TrackList } from '../ui/TrackList';
import { useUI } from '../../store/UIContext';
import { usePlayer } from '../../store/PlayerContext';

export const ArtistView = () => {
  const { activeArtist } = useUI();
  const { handlePlayTrack } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeArtist) return;
    const fetchArtist = async () => {
      try {
        setIsLoading(true);
        const results = await apiClient.search(activeArtist);
        setTracks(results);
      } catch (err) {
        setError('Failed to load artist tracks.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchArtist();
  }, [activeArtist]);

  if (!activeArtist) return <div className="text-secondary font-display" style={{padding: '24px'}}>No artist selected.</div>;
  if (isLoading) return <div className="loading-state"><Loader2 className="animate-spin text-accent" size={32} /></div>;

  const artistImage = tracks.length > 0 ? tracks[0].img : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000';

  return (
    <div className="fade-in">
      <div className="hero-widget" style={{backgroundImage: `url(${artistImage})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '300px'}}>
        <div className="hero-content">
          <h1 className="hero-title font-display" style={{fontSize: '48px', textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>{activeArtist}</h1>
          <p className="hero-subtitle font-display" style={{textShadow: '0 1px 4px rgba(0,0,0,0.5)'}}>TOP TRACKS</p>
          <button 
            className="btn-primary font-display" 
            style={{marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}
            onClick={() => tracks.length > 0 && handlePlayTrack(tracks[0], tracks)}
          >
            <Play size={16} fill="currentColor" /> PLAY ALL
          </button>
        </div>
      </div>

      <div className="section-header font-display">POPULAR</div>
      {error ? <div className="text-secondary font-display" style={{fontSize: '14px'}}>{error}</div> : <TrackList tracks={tracks} />}
    </div>
  );
};
