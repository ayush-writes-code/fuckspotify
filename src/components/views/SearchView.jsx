import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { TrackList } from '../ui/TrackList';

const CATEGORIES = [
  { id: 1, name: 'HIP-HOP', img: 'https://images.unsplash.com/photo-1605020420620-20c943cc4669?q=80&w=400' },
  { id: 2, name: 'ELECTRONIC', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400' },
  { id: 3, name: 'POP', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400' },
  { id: 4, name: 'ROCK', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400' },
];

export const SearchView = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const timeoutRef = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await apiClient.search(val);
        setResults(res);
      } catch (e) {
        setError('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleCategoryClick = (catName) => {
    handleSearch(catName);
  };

  return (
    <div className="fade-in">
      <div className="search-container glass-panel shadow-sm">
        <Search size={20} className="text-secondary" />
        <input 
          type="text" 
          className="search-input font-display" 
          placeholder="Artists, songs, or podcasts" 
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isLoading && <Loader2 size={20} className="animate-spin text-accent" />}
      </div>

      {!query ? (
        <>
          <div className="section-header font-display" style={{marginBottom: '16px'}}>BROWSE ALL</div>
          <div className="category-grid">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.id} 
                className="category-widget hover-scale" 
                style={{backgroundImage: `url(${cat.img})`}}
                onClick={() => handleCategoryClick(cat.name)}
              >
                {cat.name}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{marginTop: '24px'}}>
          {error ? (
            <div className="text-secondary font-display" style={{fontSize: '14px'}}>{error}</div>
          ) : (
            <TrackList tracks={results} emptyMessage={isLoading ? "Searching..." : "No results found."} />
          )}
        </div>
      )}
    </div>
  );
};
