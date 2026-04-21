/**
 * @filename cache.ts
 * @date 2026-04-20
 * @author Karandeep Sandhu
 * @fileoverview In-memory cache utility with TTL and size limits
 * @version 1.0.0
 */

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ENTRIES = 1000;

/**
 * Function: purgeExpiredEntries
 * Description: Removes all cache entries that have expired based on the current time.
 * Params:
 * - now: The current timestamp in milliseconds.
 * Returns: void
 */
function purgeExpiredEntries(now: number): void {
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Function: enforceCacheLimit
 * Description: Ensures the cache does not exceed the maximum entry limit by removing oldest entries.
 * Returns: void
 */
function enforceCacheLimit(): void {
  while (memoryCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (!oldestKey) return;
    memoryCache.delete(oldestKey);
  }
}

/**
 * Function: getCachedValue
 * Description: Retrieves a cached value by key if it exists and has not expired.
 * Params:
 * - key: The cache key to look up.
 * Returns: The cached value or null if not found or expired.
 */
export function getCachedValue<T>(key: string): T | null {
  const now = Date.now();
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= now) {
    memoryCache.delete(key);
    return null;
  }

  memoryCache.delete(key);
  memoryCache.set(key, entry);
  return entry.value as T;
}

/**
 * Function: setCachedValue
 * Description: Stores a value in the cache with a specified TTL.
 * Params:
 * - key: The cache key.
 * - value: The value to cache.
 * - ttlMs: Time-to-live in milliseconds.
 * Returns: void
 */
export function setCachedValue<T>(key: string, value: T, ttlMs: number): void {
  const now = Date.now();
  purgeExpiredEntries(now);
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
  }
  memoryCache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });
  enforceCacheLimit();
}

/**
 * Function: deleteCachedValue
 * Description: Removes a single entry from the cache by key.
 * Params:
 * - key: The cache key to delete.
 * Returns: void
 */
export function deleteCachedValue(key: string): void {
  memoryCache.delete(key);
}

/**
 * Function: deleteCachedPrefix
 * Description: Removes all cache entries whose keys start with the given prefix.
 * Params:
 * - prefix: The prefix to match against cache keys.
 * Returns: void
 */
export function deleteCachedPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
