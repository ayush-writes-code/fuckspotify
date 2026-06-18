import React from 'react';
import { Search, Home, Radio, Compass, Disc, Library } from 'lucide-react';
import { useUI } from '../../store/UIContext';

export const Sidebar = () => {
  const { activeTab, setActiveTab } = useUI();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo font-display">
        <Disc size={28} className="text-accent" />
        fuckspotify
      </div>
      
      <nav className="sidebar-nav">
        <div className="font-display text-secondary" style={{fontSize: '12px', marginTop: '16px', marginBottom: '8px'}}>SYSTEM</div>
        <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          <Search size={18} /> SEARCH
        </button>
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={18} /> HOME
        </button>
        <button className={`nav-item ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>
          <Compass size={18} /> NEW
        </button>
        <button className={`nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
          <Library size={18} /> LIBRARY
        </button>
        <button className={`nav-item ${activeTab === 'radio' ? 'active' : ''}`} onClick={() => setActiveTab('radio')}>
          <Radio size={18} /> RADIO
        </button>
      </nav>
    </aside>
  );
};
