/**
 * GitNode — In-Memory Cache with TTL & LRU Eviction
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxItems: number;

  constructor(maxItems = 300) {
    this.maxItems = maxItems;
  }

  /** Retrieve an item from cache, returning null if missing or expired */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /** Set an item in cache with TTL and capacity management */
  set<T>(key: string, data: T, ttlMs = 10 * 60 * 1000): void {
    // Evict oldest item if capacity reached
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  /** Fetch or populate a cached value */
  async getOrSet<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  /** Delete a specific cache key */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /** Clear all items in the cache */
  clear(): void {
    this.cache.clear();
  }

  /** Current size of active cache entries */
  get size(): number {
    return this.cache.size;
  }
}

export const globalCache = new MemoryCache();
