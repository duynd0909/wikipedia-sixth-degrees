'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface SearchProgressProps {
  isSearching: boolean;
  visitedCount: number;
  currentDepth: number;
  currentNode: string;
}

export const SearchProgress: React.FC<SearchProgressProps> = ({ 
  isSearching, 
  visitedCount, 
  currentDepth, 
  currentNode 
}) => {
  if (!isSearching) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center space-x-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">Searching...</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Pages Visited</p>
              <p className="text-2xl font-bold text-white">{visitedCount}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Current Depth</p>
              <p className="text-2xl font-bold text-white">{currentDepth}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Current Page</p>
              <p className="text-sm font-medium text-white truncate">{currentNode}</p>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentDepth / 6) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};