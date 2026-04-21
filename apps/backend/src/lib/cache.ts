interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ENTRIES = 1000;

function purgeExpiredEntries(now: number): void {
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

function enforceCacheLimit(): void {
  while (memoryCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (!oldestKey) return;
    memoryCache.delete(oldestKey);
  }
}

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

export function deleteCachedValue(key: string): void {
  memoryCache.delete(key);
}

export function deleteCachedPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
