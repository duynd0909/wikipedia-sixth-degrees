export interface WikiPage {
  id: number;
  key: string;
  title: string;
  excerpt: string;
  description?: string;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
}

export interface SearchResult {
  path: string[];
  visitedCount: number;
  searchTime: number;
  maxDepth: number;
}

export interface PathNode {
  title: string;
  parent: PathNode | null;
  depth: number;
}

export interface PageInfo {
  title: string;
  extract: string;
  thumbnail?: string;
  url: string;
}

export interface SearchProgress {
  visitedCount: number;
  currentDepth: number;
  currentNode: string;
}

export interface ProgressCallback {
  (visitedCount: number, currentDepth: number, currentNode: string): void;
}