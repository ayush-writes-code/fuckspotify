import React, { useState } from 'react';
import { Plus, Heart, Music, ListMusic, X } from 'lucide-react';
import { usePlayer } from '../../store/PlayerContext';
import { TrackList } from '../ui/TrackList';

export const LibraryView = () => {
  const { favorites, playlists, createPlaylist } = usePlayer();
  const [activeTab, setActiveTab] = useState('favorites'); // favorites, playlists
  const [showModal, setShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylistSubmit = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowModal(false);
    }
  };

  const handleCreatePlaylistClick = () => {
    setShowModal(true);
  };

  return (
    <div className="fade-in">
      <div className="section-header font-display" style={{fontSize: '32px', marginBottom: '24px'}}>LIBRARY</div>

      <div style={{display: 'flex', gap: '16px', marginBottom: '32px'}}>
        <button 
          className={`font-display ${activeTab === 'favorites' ? 'text-primary' : 'text-secondary'}`}
          style={{fontSize: '14px', letterSpacing: '1px', background: 'none', border: 'none', padding: '0', cursor: 'pointer', transition: 'color 0.2s'}}
          onClick={() => setActiveTab('favorites')}
        >
          FAVORITES
        </button>
        <button 
          className={`font-display ${activeTab === 'playlists' ? 'text-primary' : 'text-secondary'}`}
          style={{fontSize: '14px', letterSpacing: '1px', background: 'none', border: 'none', padding: '0', cursor: 'pointer', transition: 'color 0.2s'}}
          onClick={() => setActiveTab('playlists')}
        >
          PLAYLISTS
        </button>
      </div>

      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-secondary font-display" style={{padding: '40px 0', textAlign: 'center'}}>
              <Heart size={48} style={{margin: '0 auto 16px', opacity: 0.2}} />
              <div>NO FAVORITES YET.</div>
              <div style={{fontSize: '12px', marginTop: '8px', opacity: 0.7}}>TAP THE HEART ICON TO SAVE TRACKS.</div>
            </div>
          ) : (
            <TrackList tracks={favorites} contextPlaylist={favorites} />
          )}
        </div>
      )}

      {activeTab === 'playlists' && (
        <div>
          <button className="btn-primary font-display" style={{marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={handleCreatePlaylistClick}>
            <Plus size={16} /> NEW PLAYLIST
          </button>
          
          {playlists.length === 0 ? (
            <div className="text-secondary font-display" style={{padding: '40px 0', textAlign: 'center'}}>
              <ListMusic size={48} style={{margin: '0 auto 16px', opacity: 0.2}} />
              <div>NO PLAYLISTS YET.</div>
            </div>
          ) : (
            <div className="playlist-grid">
              {playlists.map(pl => (
                <div key={pl.id} className="playlist-widget glass-panel">
                  <div className="playlist-art">
                    {pl.tracks.length > 0 ? (
                      pl.tracks.length >= 4 ? (
                        <div className="art-grid">
                          <div style={{backgroundImage: `url(${pl.tracks[0].img})`}}></div>
                          <div style={{backgroundImage: `url(${pl.tracks[1].img})`}}></div>
                          <div style={{backgroundImage: `url(${pl.tracks[2].img})`}}></div>
                          <div style={{backgroundImage: `url(${pl.tracks[3].img})`}}></div>
                        </div>
                      ) : (
                        <div className="art-single" style={{backgroundImage: `url(${pl.tracks[0].img})`}}></div>
                      )
                    ) : (
                      <div className="art-empty text-secondary"><Music size={32} /></div>
                    )}
                  </div>
                  <div className="font-display" style={{fontSize: '14px', marginBottom: '4px'}}>{pl.name}</div>
                  <div className="font-display text-secondary" style={{fontSize: '11px'}}>{pl.tracks.length} TRACKS</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-panel shadow-glow" onClick={e => e.stopPropagation()} style={{
            width: '90%', maxWidth: '320px', padding: '24px', borderRadius: '16px', position: 'relative'
          }}>
            <button className="icon-btn" style={{position: 'absolute', top: '16px', right: '16px'}} onClick={() => setShowModal(false)}>
              <X size={20} className="text-secondary" />
            </button>
            <h2 className="font-display" style={{marginBottom: '16px', fontSize: '18px'}}>NEW PLAYLIST</h2>
            <form onSubmit={handleCreatePlaylistSubmit}>
              <input 
                type="text" 
                className="search-input font-display" 
                style={{width: '100%', marginBottom: '16px'}}
                placeholder="Playlist Name" 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary font-display" style={{width: '100%'}}>CREATE</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
