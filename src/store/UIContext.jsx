/* eslint-disable react-refresh/only-export-components, no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('new');
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <UIContext.Provider value={{
      activeTab, setActiveTab,
      isMobilePlayerOpen, setIsMobilePlayerOpen,
      isQueueOpen, setIsQueueOpen,
      isLyricsOpen, setIsLyricsOpen,
      isMobile
    }}>
      {children}
    </UIContext.Provider>
  );
};
