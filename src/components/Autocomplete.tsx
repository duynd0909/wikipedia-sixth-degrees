'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { WikiPage } from '@/types/wikipedia';
import { WikipediaService } from '@/services/WikipediaService';

interface AutocompleteProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: WikiPage) => void;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  placeholder,
  value,
  onChange,
  onSelect,
}) => {
  const [suggestions, setSuggestions] = useState<WikiPage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wikiService = useRef(new WikipediaService());
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  const handleSearch = async (searchValue: string) => {
    if (searchValue.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      const results = await wikiService.current.searchArticles(searchValue);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
            handleSearch(newValue);
          }}
          onFocus={() => setIsOpen(suggestions.length > 0)}
          onBlur={() => {
            // Delay closing to allow click events to fire
            setTimeout(() => setIsOpen(false), 150);
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
        )}
        {value && !loading && (
          <button
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              key={item.id}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-start space-x-3"
              onClick={() => {
                onSelect(item);
                setIsOpen(false);
                setSuggestions([]);
              }}
            >
              {item.thumbnail && (
                <img
                  src={
                    item.thumbnail.url.startsWith('//')
                      ? `https:${item.thumbnail.url}`
                      : item.thumbnail.url
                  }
                  alt={item.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <div className="text-white font-medium">{item.title}</div>
                {item.description && (
                  <div className="text-gray-400 text-sm">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
