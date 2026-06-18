import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { TrackList } from '../ui/TrackList';
import { usePlayer } from '../../store/PlayerContext';

export const NewReleasesView = () => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { handlePlayTrack } = usePlayer();

  useEffect(() => {
    const fetchNew = async () => {
      try {
        setIsLoading(true);
        const results = await apiClient.search('global top 50');
        setTracks(results);
      } catch (err) {
        setError('Failed to load new releases.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNew();
  }, []);

  if (isLoading) return <div className="loading-state"><Loader2 className="animate-spin text-accent" size={32} /></div>;

  return (
    <div className="fade-in">
      <div className="hero-widget" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=1200)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="hero-content">
          <div className="font-display" style={{fontSize: '12px', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px'}}>NEW MUSIC</div>
          <h1 className="hero-title font-display">DISCOVER</h1>
          <p className="hero-subtitle font-display">THE LATEST SOUNDS.</p>
        </div>
      </div>

      <div className="section-header font-display" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        RECENTLY ADDED
        {tracks.length > 0 && (
          <button className="btn-primary font-display" style={{padding: '6px 16px', fontSize: '12px'}} onClick={() => handlePlayTrack(tracks[0], tracks)}>
            PLAY ALL
          </button>
        )}
      </div>
      
      {error ? <div className="text-secondary font-display" style={{fontSize: '14px'}}>{error}</div> : <TrackList tracks={tracks} />}
    </div>
  );
};
