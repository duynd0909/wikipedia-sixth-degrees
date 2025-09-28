'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shuffle, Info, Zap, Loader2 } from 'lucide-react';
import {
  SearchResult,
  PageInfo,
  SearchProgress,
} from '@/types/wikipedia';
import { WikipediaService } from '@/services/WikipediaService';
import { Autocomplete } from './Autocomplete';
import { SearchProgress as SearchProgressComponent } from './SearchProgress';
import { PathVisualization } from './PathVisualization';

// Main App Component
export default function WikipediaSixDegrees() {
  const [startArticle, setStartArticle] = useState('');
  const [endArticle, setEndArticle] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [pathInfo, setPathInfo] = useState<(PageInfo | null)[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<SearchProgress>({
    visitedCount: 0,
    currentDepth: 0,
    currentNode: '',
  });

  const wikiService = useRef(new WikipediaService());

  useEffect(() => {
    wikiService.current.setProgressCallback(
      (visitedCount, currentDepth, currentNode) => {
        setProgress({ visitedCount, currentDepth, currentNode });
      }
    );
  }, []);

  const handleSearch = async () => {
    if (!startArticle || !endArticle) {
      setError('Please select both start and end articles');
      return;
    }

    setError('');
    setIsSearching(true);
    setSearchResult(null);
    setPathInfo([]);
    setProgress({
      visitedCount: 0,
      currentDepth: 0,
      currentNode: startArticle,
    });

    try {
      const result = await wikiService.current.findPath(
        startArticle,
        endArticle
      );
      setSearchResult(result);

      // Fetch detailed info for each article in the path
      const infoPromises = result.path.map((title) =>
        wikiService.current.getPageInfo(title)
      );
      const info = await Promise.all(infoPromises);
      setPathInfo(info);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Search failed. Please try different articles.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleRandomChallenge = async () => {
    setIsSearching(true);
    setError('');
    try {
      const [start, end] = await Promise.all([
        wikiService.current.getRandomArticle(),
        wikiService.current.getRandomArticle(),
      ]);
      setStartArticle(start);
      setEndArticle(end);

      // Automatically start search
      setTimeout(() => {
        handleSearch();
      }, 500);
    } catch (err) {
      setError('Failed to generate random challenge');
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Wikipedia Six Degrees
          </h1>
          <p className="text-gray-400 text-lg">
            Discover how any two Wikipedia articles are connected in 6 steps or
            less
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Start Article
              </label>
              <Autocomplete
                placeholder="Search for starting article..."
                value={startArticle}
                onChange={setStartArticle}
                onSelect={(item) => setStartArticle(item.title)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                End Article
              </label>
              <Autocomplete
                placeholder="Search for destination article..."
                value={endArticle}
                onChange={setEndArticle}
                onSelect={(item) => setEndArticle(item.title)}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSearch}
              disabled={isSearching || !startArticle || !endArticle}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Find Path</span>
                </>
              )}
            </button>
            <button
              onClick={handleRandomChallenge}
              disabled={isSearching}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Shuffle className="w-5 h-5" />
              <span>Random Challenge</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Progress Display */}
        <SearchProgressComponent
          isSearching={isSearching}
          visitedCount={progress.visitedCount}
          currentDepth={progress.currentDepth}
          currentNode={progress.currentNode}
        />

        {/* Results */}
        {searchResult && (
          <PathVisualization
            path={searchResult.path}
            pathInfo={pathInfo}
            searchTime={searchResult.searchTime}
            visitedCount={searchResult.visitedCount}
          />
        )}

        {/* Info Section */}
        {!isSearching && !searchResult && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <Info className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How it works
                </h3>
                <ul className="text-gray-300 space-y-2">
                  <li>
                    • The app uses breadth-first search to find the shortest
                    path between articles
                  </li>
                  <li>
                    • It explores Wikipedia links level by level, up to 6
                    degrees of separation
                  </li>
                  <li>
                    • Try the random challenge for a fun way to explore
                    unexpected connections
                  </li>
                  <li>• Most articles are connected within 3-4 steps!</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
