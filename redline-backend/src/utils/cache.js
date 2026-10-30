// Simple high-performance in-memory TTL cache
class MemoryCache {
  constructor(defaultTtlMs = 600000) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });

    // Prevent memory leaks: trim if cache grows too large
    if (this.cache.size > 2000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now > v.expiry) {
          this.cache.delete(k);
        }
      }
    }
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const searchCache = new MemoryCache(10 * 60 * 1000); // 10 minutes
export const streamCache = new MemoryCache(2 * 60 * 60 * 1000); // 2 hours
export const lyricsCache = new MemoryCache(24 * 60 * 60 * 1000); // 24 hours
export const homeCache = new MemoryCache(30 * 60 * 1000); // 30 minutes
