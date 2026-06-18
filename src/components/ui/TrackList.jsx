import React from 'react';
import { TrackItem } from './TrackItem';

export const TrackList = ({ tracks, contextPlaylist, showArt = true, emptyMessage = "No tracks found." }) => {
  if (!tracks || tracks.length === 0) {
    return <div className="text-secondary font-display" style={{fontSize: '14px', padding: '24px 0'}}>{emptyMessage}</div>;
  }

  return (
    <div className="track-grid" style={{gridTemplateColumns: '1fr', paddingBottom: '24px'}}>
      {tracks.map((track) => (
        <TrackItem 
          key={track.id} 
          track={track} 
          contextPlaylist={contextPlaylist || tracks} 
          showArt={showArt} 
        />
      ))}
    </div>
  );
};
