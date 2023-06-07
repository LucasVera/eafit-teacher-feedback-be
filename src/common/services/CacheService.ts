import { cacheConfig } from "../config"
import { getTimestamp, isTimestampExpired } from "../util/date"

interface CachedObject<T> {
  object: T
  timestamp: number
}

const inMemoryCache = new Map<string, CachedObject<any>>()

export default {
  getCachedObject: function <T>(key: string): T | null {
    const item = inMemoryCache.get(key)
    if (!item) return null

    if (isTimestampExpired(item.timestamp, cacheConfig.IN_MEMORY_CACHE_TTL_SECONDS)) {
      inMemoryCache.delete(key)
      return null
    }
    return item.object
  },

  setCachedObject: function <T>(key: string, object: T): void {
    const item: CachedObject<T> = {
      object,
      timestamp: getTimestamp(),
    }

    inMemoryCache.set(key, item)
  }
}
