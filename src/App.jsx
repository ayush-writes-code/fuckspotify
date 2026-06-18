import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import './index.css';

import { PlayerProvider } from './store/PlayerContext';
import { UIProvider, useUI } from './store/UIContext';

import { Sidebar } from './components/ui/Sidebar';
import { MobileTabBar } from './components/ui/MobileTabBar';

import { GlobalPlayer } from './components/player/GlobalPlayer';
import { MobilePlayerOverlay } from './components/player/MobilePlayerOverlay';
import { QueueOverlay } from './components/player/QueueOverlay';

import { HomeView } from './components/views/HomeView';
import { SearchView } from './components/views/SearchView';
import { LibraryView } from './components/views/LibraryView';
import { RadioView } from './components/views/RadioView';
import { NewReleasesView } from './components/views/NewReleasesView';

function AppContent() {
  const { activeTab, isMobile } = useUI();
  
  // PWA Install States
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSInstallPrompt, setShowIOSInstallPrompt] = useState(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    return Boolean(isIOS && !isStandalone && !localStorage.getItem('fuckspotify_dismissed_ios_install'));
  });

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasDismissed = localStorage.getItem('fuckspotify_dismissed_install');
      const hasInstalled = localStorage.getItem('fuckspotify_installed');
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

      if (!hasDismissed && !hasInstalled && !isStandalone) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    setShowInstallPrompt(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('fuckspotify_installed', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismissPwa = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('fuckspotify_dismissed_install', 'true');
  };

  const handleDismissIOSPwa = () => {
    setShowIOSInstallPrompt(false);
    localStorage.setItem('fuckspotify_dismissed_ios_install', 'true');
  };

  return (
    <div className={`app-container ${isMobile ? 'is-mobile' : ''}`}>
      {showInstallPrompt && (
        <div className="pwa-install-banner glass-panel shadow-glow">
          <div className="pwa-banner-content">
            <div className="pwa-icon">
              <Download size={24} className="text-accent" />
            </div>
            <div className="pwa-text">
              <div className="font-display" style={{fontSize: '14px'}}>INSTALL FUCKSPOTIFY</div>
              <div className="font-display" style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)'}}>ADD TO HOME SCREEN FOR FULL EXPERIENCE</div>
            </div>
          </div>
          <div className="pwa-actions">
            <button className="btn-primary font-display" style={{padding: '6px 12px', fontSize: '12px'}} onClick={handleInstallPwa}>INSTALL</button>
            <button className="icon-btn text-secondary hover:text-primary" onClick={handleDismissPwa}><X size={20} /></button>
          </div>
        </div>
      )}

      {showIOSInstallPrompt && (
        <div className="pwa-install-banner glass-panel shadow-glow ios-prompt" style={{top: 'auto', bottom: '80px', left: '16px', right: '16px'}}>
          <div className="pwa-banner-content">
            <div className="pwa-icon">
              <Share size={24} className="text-accent" />
            </div>
            <div className="pwa-text">
              <div className="font-display" style={{fontSize: '14px'}}>INSTALL FUCKSPOTIFY</div>
              <div className="font-display" style={{fontSize: '11px', color: 'rgba(255,255,255,0.7)'}}>TAP SHARE BUTTON <span style={{display: 'inline-block', transform: 'translateY(2px)'}}><Share size={12} /></span> AND SELECT 'ADD TO HOME SCREEN'</div>
            </div>
          </div>
          <div className="pwa-actions">
            <button className="icon-btn text-secondary hover:text-primary" onClick={handleDismissIOSPwa}><X size={20} /></button>
          </div>
        </div>
      )}

      <Sidebar />

      <main className="main-content">
        {activeTab === 'new' && <NewReleasesView />}
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'search' && <SearchView />}
        {activeTab === 'library' && <LibraryView />}
        {activeTab === 'radio' && <RadioView />}
      </main>

      <GlobalPlayer />
      <MobileTabBar />
      <MobilePlayerOverlay />
      <QueueOverlay />
    </div>
  );
}

function App() {
  return (
    <PlayerProvider>
      <UIProvider>
        <AppContent />
      </UIProvider>
    </PlayerProvider>
  );
}

export default App;
