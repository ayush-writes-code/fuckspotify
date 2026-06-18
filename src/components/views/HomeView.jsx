import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { TrackList } from '../ui/TrackList';

export const HomeView = () => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHome = async () => {
      try {
        setIsLoading(true);
        const results = await apiClient.search('pop hits 2024');
        setTracks(results);
      } catch (err) {
        setError('Failed to load home tracks.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHome();
  }, []);

  if (isLoading) return <div className="loading-state"><Loader2 className="animate-spin text-accent" size={32} /></div>;

  return (
    <div className="fade-in">
      <div className="hero-widget" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1493225457124-a1a2a5f45bce?q=80&w=1200)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="hero-content">
          <div className="font-display" style={{fontSize: '12px', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px'}}>FEATURED PLAYLIST</div>
          <h1 className="hero-title font-display">ESSENTIALS</h1>
          <p className="hero-subtitle font-display">THE DEFINITIVE COLLECTION.</p>
        </div>
      </div>

      <div className="section-header font-display">RECOMMENDED FOR YOU</div>
      {error ? <div className="text-secondary font-display" style={{fontSize: '14px'}}>{error}</div> : <TrackList tracks={tracks} />}
    </div>
  );
};
