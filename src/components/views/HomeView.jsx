import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { TrackItem } from '../ui/TrackItem';

export const HomeView = () => {
  const [sections, setSections] = useState({ recommended: [], newReleases: [], lofi: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHome = async () => {
      try {
        setIsLoading(true);
        const [rec, newRel, lofi] = await Promise.all([
          apiClient.search('pop hits 2024').catch(() => []),
          apiClient.search('new releases english').catch(() => []),
          apiClient.search('lofi beats').catch(() => [])
        ]);
        setSections({ recommended: rec, newReleases: newRel, lofi });
      } catch (err) {
        setError('Failed to load discovery data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHome();
  }, []);

  if (isLoading) return <div className="loading-state"><Loader2 className="animate-spin text-accent" size={32} /></div>;

  const renderHorizontalList = (tracks) => (
    <div className="horizontal-carousel">
      {tracks.map((track, i) => (
        <div key={i} className="carousel-item">
          <TrackItem track={track} contextPlaylist={tracks} showArt={true} isPoster={true} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="fade-in pb-24">
      <div className="hero-widget" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1493225457124-a1a2a5f45bce?q=80&w=1200)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="hero-content">
          <div className="font-display" style={{fontSize: '12px', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px'}}>FEATURED PLAYLIST</div>
          <h1 className="hero-title font-display">ESSENTIALS</h1>
          <p className="hero-subtitle font-display">THE DEFINITIVE COLLECTION.</p>
        </div>
      </div>

      {error && <div className="text-secondary font-display" style={{fontSize: '14px', padding: '16px'}}>{error}</div>}

      <div className="section-header font-display mt-8">RECOMMENDED FOR YOU</div>
      {renderHorizontalList(sections.recommended)}

      <div className="section-header font-display mt-8">NEW RELEASES</div>
      {renderHorizontalList(sections.newReleases)}

      <div className="section-header font-display mt-8">CHILL & FOCUS</div>
      {renderHorizontalList(sections.lofi)}
    </div>
  );
};
