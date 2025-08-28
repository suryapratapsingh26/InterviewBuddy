// Persistent server-side cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ServerCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove expired entries
    this.startCleanup();
  }

  set<T>(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  private startCleanup(): void {
    // Clean up expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 30000);
  }

  // Clean up on process exit
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Create a singleton instance
const serverCache = new ServerCache();

// Handle process cleanup
process.on("beforeExit", () => {
  serverCache.destroy();
});

process.on("SIGINT", () => {
  serverCache.destroy();
  process.exit(0);
});

export default serverCache;

// Convenience functions for common cache patterns
export const cacheGet = <T>(key: string): T | null => serverCache.get<T>(key);
export const cacheSet = <T>(key: string, data: T, ttl?: number): void =>
  serverCache.set(key, data, ttl);
export const cacheHas = (key: string): boolean => serverCache.has(key);
export const cacheDelete = (key: string): boolean => serverCache.delete(key);
export const cacheClear = (): void => serverCache.clear();
export const cacheStats = () => serverCache.getStats();
