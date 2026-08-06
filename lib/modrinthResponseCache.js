const store = new Map()
const MAX_ENTRIES = 1000

export function getModrinthCache(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    store.delete(key)
    return null
  }
  return entry.data
}

export function getModrinthCacheStale(key) {
  return store.get(key)?.data ?? null
}

export function setModrinthCache(key, data, ttlMs) {
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value
    store.delete(firstKey)
  }
  store.set(key, { data, expires: Date.now() + ttlMs })
}
