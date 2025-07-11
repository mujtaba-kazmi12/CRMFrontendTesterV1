// Simple client-side cache for frequently accessed data
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class ClientCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = 300000): void { // default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const clientCache = new ClientCache();

// Cache keys
export const CACHE_KEYS = {
  CATEGORIES: 'categories',
  TAGS: 'tags',
  POSTS: 'posts',
  CATEGORY_POSTS: (slug: string) => `category_posts_${slug}`,
  POST: (slug: string) => `post_${slug}`,
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  CATEGORIES: 300000, // 5 minutes
  TAGS: 600000, // 10 minutes
  POSTS: 180000, // 3 minutes
  CATEGORY_POSTS: 180000, // 3 minutes
  POST: 600000, // 10 minutes
} as const;

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.cleanup();
  }, 300000);
} 