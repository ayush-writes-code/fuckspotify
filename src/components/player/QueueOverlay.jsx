import React, { useEffect, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { usePlayer } from '../../store/PlayerContext';
import { useUI } from '../../store/UIContext';
import { TrackItem } from '../ui/TrackItem';
import { apiClient } from '../../services/apiClient';

export const QueueOverlay = () => {
  const { currentPlaylist, currentTrackIndex, isPlaying, currentTrack } = usePlayer();
  const { isQueueOpen, setIsQueueOpen, isLyricsOpen } = useUI();
  const [lyrics, setLyrics] = useState({ type: 'empty', data: null, trackId: null });
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1); // Requires synced lyrics logic which is complex
  // For now, let's keep it simple or implement it if time permits

  const upcomingTracks = currentPlaylist.slice(currentTrackIndex + 1);

  // Quick fetch lyrics if isLyricsOpen and currentTrack changes
  useEffect(() => {
    if (isLyricsOpen && currentTrack.id !== 'default' && lyrics.trackId !== currentTrack.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingLyrics(true);
      apiClient.getLyrics(currentTrack.title, currentTrack.artist).then(res => {
        setLyrics({ type: res.type, data: res.data, trackId: currentTrack.id });
      }).catch(() => {
        setLyrics({ type: 'error', data: 'Failed to fetch lyrics.', trackId: currentTrack.id });
      }).finally(() => {
        setIsLoadingLyrics(false);
      });
    }
  }, [isLyricsOpen, currentTrack, lyrics.trackId]);

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
        {isLyricsOpen ? (
          <div>
            {isLoadingLyrics ? (
              <div className="text-secondary font-display" style={{textAlign: 'center', marginTop: '60px'}}><Loader2 className="animate-spin mx-auto" size={32}/> Fetching Lyrics...</div>
            ) : lyrics.type === 'synced' ? (
              <div className="synced-lyrics-container font-display">
                {lyrics.data.map((line, i) => (
                  <div key={i} className={`synced-lyric-line ${i === activeLyricIndex ? 'active' : ''}`}>
                    {line.text}
                  </div>
                ))}
              </div>
            ) : lyrics.type === 'plain' ? (
              <pre className="lyrics-plain font-display">{lyrics.data}</pre>
            ) : (
              <div className="text-secondary font-display" style={{textAlign: 'center', marginTop: '60px'}}>{lyrics.data || 'Lyrics not available'}</div>
            )}
          </div>
        ) : (
          upcomingTracks.length > 0 ? (
            <div className="track-grid" style={{gridTemplateColumns: '1fr', paddingBottom: '100px'}}>
              {upcomingTracks.map((track, i) => (
                <TrackItem key={i} track={track} contextPlaylist={currentPlaylist} showArt={true} />
              ))}
            </div>
          ) : (
            <div className="font-display text-secondary" style={{textAlign: 'center', marginTop: '60px', letterSpacing: '1px'}}>
              QUEUE IS EMPTY
            </div>
          )
        )}
      </div>
    </div>
  );
};
