import { WikiPage, SearchResult, PathNode, PageInfo, ProgressCallback } from '@/types/wikipedia';

export class WikipediaService {
  private readonly API_BASE = 'https://en.wikipedia.org/w/api.php';
  private readonly SEARCH_API = 'https://en.wikipedia.org/w/rest.php/v1/search/title';
  private readonly MAX_DEPTH = 6;
  private visited: Set<string>;
  private queue: PathNode[];
  private onProgress?: ProgressCallback;

  constructor() {
    this.visited = new Set();
    this.queue = [];
  }

  setProgressCallback(callback: ProgressCallback) {
    this.onProgress = callback;
  }

  async searchArticles(query: string): Promise<WikiPage[]> {
    if (!query) return [];
    
    try {
      const response = await fetch(`${this.SEARCH_API}?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      return data.pages || [];
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  }

  async getRandomArticle(): Promise<string> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'random',
      rnnamespace: '0',
      rnlimit: '1',
      origin: '*'
    });

    try {
      const response = await fetch(`${this.API_BASE}?${params}`);
      const data = await response.json();
      
      if (data.query.random.length > 0) {
        return data.query.random[0].title;
      }
      throw new Error('Could not fetch random article');
    } catch (error) {
      console.error('Error fetching random article:', error);
      throw error;
    }
  }

  async findPath(startTitle: string, endTitle: string): Promise<SearchResult> {
    const startTime = Date.now();
    this.visited.clear();
    this.queue = [];

    startTitle = this.normalizeTitle(startTitle);
    endTitle = this.normalizeTitle(endTitle);

    const startNode: PathNode = { title: startTitle, parent: null, depth: 0 };
    this.queue.push(startNode);
    this.visited.add(startTitle);

    while (this.queue.length > 0) {
      const current = this.queue.shift()!;
      
      if (this.onProgress && this.visited.size % 10 === 0) {
        this.onProgress(this.visited.size, current.depth, current.title);
      }

      if (current.title === endTitle) {
        const path = this.reconstructPath(current);
        return {
          path,
          visitedCount: this.visited.size,
          searchTime: Date.now() - startTime,
          maxDepth: current.depth
        };
      }

      if (current.depth >= this.MAX_DEPTH) {
        continue;
      }

      const links = await this.getPageLinks(current.title);
      
      for (const link of links) {
        const linkTitle = this.normalizeTitle(link.title);
        
        if (!this.visited.has(linkTitle)) {
          this.visited.add(linkTitle);
          
          const newNode: PathNode = {
            title: linkTitle,
            parent: current,
            depth: current.depth + 1
          };
          
          this.queue.push(newNode);

          if (linkTitle === endTitle) {
            const path = this.reconstructPath(newNode);
            return {
              path,
              visitedCount: this.visited.size,
              searchTime: Date.now() - startTime,
              maxDepth: newNode.depth
            };
          }
        }
      }
    }

    throw new Error(`No path found between "${startTitle}" and "${endTitle}" within ${this.MAX_DEPTH} degrees`);
  }

  async getPageInfo(pageTitle: string): Promise<PageInfo | null> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'extracts|pageimages|info',
      titles: pageTitle,
      exintro: 'true',
      explaintext: 'true',
      exsentences: '2',
      piprop: 'thumbnail',
      pithumbsize: '300',
      inprop: 'url',
      origin: '*'
    });

    try {
      const response = await fetch(`${this.API_BASE}?${params}`);
      const data = await response.json();
      
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      
      if (pageId === '-1') return null;

      return {
        title: pages[pageId].title,
        extract: pages[pageId].extract,
        thumbnail: pages[pageId].thumbnail?.source,
        url: pages[pageId].fullurl
      };
    } catch (error) {
      console.error(`Error fetching page info for ${pageTitle}:`, error);
      return null;
    }
  }

  private async getPageLinks(pageTitle: string): Promise<{ title: string }[]> {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'links',
      titles: pageTitle,
      pllimit: 'max',
      plnamespace: '0',
      origin: '*'
    });

    try {
      const response = await fetch(`${this.API_BASE}?${params}`);
      const data = await response.json();
      
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      
      if (pageId === '-1' || !pages[pageId].links) {
        return [];
      }

      return pages[pageId].links.filter((link: { title: string }) => 
        !link.title.startsWith('Wikipedia:') && 
        !link.title.startsWith('Help:') &&
        !link.title.startsWith('Template:') &&
        !link.title.startsWith('Category:')
      );
    } catch (error) {
      console.error(`Error fetching links for ${pageTitle}:`, error);
      return [];
    }
  }

  private reconstructPath(node: PathNode): string[] {
    const path: string[] = [];
    let current: PathNode | null = node;
    
    while (current !== null) {
      path.unshift(current.title);
      current = current.parent;
    }
    
    return path;
  }

  private normalizeTitle(title: string): string {
    return title
      .trim()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}