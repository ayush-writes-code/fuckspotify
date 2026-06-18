import React from 'react';
import { Mic2 } from 'lucide-react';
import { usePlayer } from '../../store/PlayerContext';
import { audioEngine } from '../../services/audioEngine';

export const RadioView = () => {
  const { isPlaying, isRadio, setIsRadio, setIsPlaying, setCurrentPlaylist } = usePlayer();

  return (
    <div className="page-container fade-in">
      <div className="section-header font-display text-secondary">
        LIVE BROADCAST <span className="text-accent">[]</span>
      </div>
      <div className="radio-widget">
        {(isPlaying && isRadio) ? (
          <>
            <div className="radio-waves" style={{ animationDelay: '0s' }}></div>
            <div className="radio-waves" style={{ animationDelay: '0.6s' }}></div>
            <div className="radio-waves" style={{ animationDelay: '1.2s' }}></div>
          </>
        ) : null}
        <Mic2 size={64} className={(isPlaying && isRadio) ? "text-accent" : "text-secondary"} style={{zIndex: 2, marginBottom: '24px'}} />
        <h2 className="font-display" style={{zIndex: 2, fontSize: '32px'}}>fuckspotify RADIO 1</h2>
        <p className="text-secondary font-display" style={{zIndex: 2}}>BROADCASTING TO THE WORLD</p>
        
        <button 
          className="btn-primary font-display" 
          style={{zIndex: 2, marginTop: '32px', backgroundColor: (isPlaying && isRadio) ? 'transparent' : '', border: (isPlaying && isRadio) ? '1px solid var(--accent-color)' : ''}}
          onClick={async () => {
            if (isPlaying && isRadio) {
              audioEngine.pause();
              // State updates handled by event listeners in PlayerContext
            } else {
              setIsRadio(true);
              setCurrentPlaylist([]); // This should trigger trackIndex = -1 but since we don't expose it directly, let's just let it play radio.
              // Actually, I need to clear the current track so the player displays Radio.
              const radioUrl = 'https://icecast2.play.cz/evropa2-128.mp3';
              audioEngine.setSrc(radioUrl);
              await audioEngine.play();
            }
          }}
        >
          {(isPlaying && isRadio) ? 'STOP BROADCAST' : 'TUNE IN'}
        </button>
      </div>
    </div>
  );
};
