import React from 'react';
import { Search, Home, Compass, Library } from 'lucide-react';
import { useUI } from '../../store/UIContext';

export const MobileTabBar = () => {
  const { activeTab, setActiveTab } = useUI();

  return (
    <div className="mobile-tab-bar glass-panel">
      <button className={`nav-item text-secondary ${activeTab === 'home' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('home')}>
        <Home size={24} />
      </button>
      <button className={`nav-item text-secondary ${activeTab === 'new' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('new')}>
        <Compass size={24} />
      </button>
      <button className={`nav-item text-secondary ${activeTab === 'library' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('library')}>
        <Library size={24} />
      </button>
      <button className={`nav-item text-secondary ${activeTab === 'search' ? 'text-accent' : ''}`} style={{border: 'none', padding: '8px', backgroundColor: 'transparent'}} onClick={() => setActiveTab('search')}>
        <Search size={24} />
      </button>
    </div>
  );
};
