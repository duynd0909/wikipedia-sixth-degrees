'use client';

import React from 'react';
import { ChevronRight, TrendingUp, Globe, Timer } from 'lucide-react';
import { PageInfo } from '@/types/wikipedia';

interface PathVisualizationProps {
  path: string[];
  pathInfo: (PageInfo | null)[];
  searchTime: number;
  visitedCount: number;
}

export const PathVisualization: React.FC<PathVisualizationProps> = ({ 
  path, 
  pathInfo, 
  searchTime, 
  visitedCount 
}) => {
  if (path.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Path Found!</h3>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">{path.length - 1} degrees</span>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300">{visitedCount} pages visited</span>
          </div>
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-300">{(searchTime / 1000).toFixed(2)}s</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {pathInfo.map((info, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
            </div>
            <div className="flex-1 bg-gray-700 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {info?.thumbnail && (
                  <img 
                    src={info.thumbnail}
                    alt={info.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">{info?.title || path[index]}</h4>
                  <p className="text-gray-300 text-sm mb-2">{info?.extract || 'Loading...'}</p>
                  {info?.url && (
                    <a 
                      href={info.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center"
                    >
                      View on Wikipedia
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            {index < pathInfo.length - 1 && (
              <div className="flex-shrink-0">
                <ChevronRight className="w-6 h-6 text-gray-500 mt-6" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};