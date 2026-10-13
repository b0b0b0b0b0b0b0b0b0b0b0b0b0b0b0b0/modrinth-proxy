const CACHE_KEY = 'mp-favorites'
const CACHE_LIMIT = 500
const SIGNED_COOKIE = 'mp_signed'

export function readFavoritesCache() {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    return Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

export function writeFavoritesCache(ids) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ids.slice(-CACHE_LIMIT)))
  } catch {}
}

export function updateFavoritesCache(projectId, favorite) {
  const ids = new Set(readFavoritesCache() || [])
  if (favorite) ids.add(projectId)
  else ids.delete(projectId)
  writeFavoritesCache([...ids])
}

export function clearFavoritesCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {}
}

export function guessFavorite(projectId) {
  try {
    if (!document.cookie.split('; ').some((part) => part.startsWith(`${SIGNED_COOKIE}=`))) return false
  } catch {
    return null
  }
  const ids = readFavoritesCache()
  return ids ? ids.includes(projectId) : null
}
