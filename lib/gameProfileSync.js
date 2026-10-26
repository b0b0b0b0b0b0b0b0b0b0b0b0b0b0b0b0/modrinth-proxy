import { favoritesManager } from './favoritesManager'
import { PROFILE_MOD_LOADER_IDS, PROFILE_SERVER_CORE_IDS } from './loaders'

const LINKS = {
  mod: { version: 'gameVersion', loader: 'gameLoader', loaders: PROFILE_MOD_LOADER_IDS },
  plugin: { version: 'serverVersion', loader: 'serverCore', loaders: PROFILE_SERVER_CORE_IDS },
}
const GAME_VERSION_RE = /^[0-9a-z][0-9a-z.\-+]{0,31}$/i
const IMPORTED_KEY = 'game-profile-imported'

export const GAME_PROFILE_EVENT = 'game-profile-changed'

function isSigned() {
  return typeof document !== 'undefined' && document.cookie.includes('mp_signed=1')
}

function linkFor(contentType) {
  return LINKS[favoritesManager._normalizeContentType(contentType)] || null
}

function fits(link, kind, value) {
  if (!value) return true
  return kind === 'loader' ? link.loaders.includes(value) : GAME_VERSION_RE.test(value)
}

function readImported() {
  try {
    const list = JSON.parse(localStorage.getItem(IMPORTED_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function markImported(account) {
  try {
    localStorage.setItem(IMPORTED_KEY, JSON.stringify([...new Set([...readImported(), account])].slice(-20)))
  } catch {}
}

function readCache() {
  const payload = {}
  for (const [type, link] of Object.entries(LINKS)) {
    const version = favoritesManager.getFavoriteMcVersion(type)
    const loader = favoritesManager.getFavoriteLoader(type)
    if (version && fits(link, 'version', version)) payload[link.version] = version
    if (loader && fits(link, 'loader', loader)) payload[link.loader] = loader
  }
  return payload
}

function writeCache(type, kind, value) {
  if (kind === 'version') favoritesManager.setFavoriteMcVersion(value, type)
  else favoritesManager.setFavoriteLoader(value, type)
}

function applyAccountToCache(profile) {
  for (const [type, link] of Object.entries(LINKS)) {
    for (const kind of ['version', 'loader']) {
      const fromAccount = profile[link[kind]] || ''
      const cached = kind === 'version' ? favoritesManager.getFavoriteMcVersion(type) : favoritesManager.getFavoriteLoader(type)
      if (fromAccount === cached) continue
      if (!fromAccount && !fits(link, kind, cached)) continue
      writeCache(type, kind, fromAccount)
    }
  }
  window.dispatchEvent(new Event(GAME_PROFILE_EVENT))
}

let running = null

export function syncGameProfile() {
  if (!isSigned()) return Promise.resolve(null)
  if (running) return running
  running = (async () => {
    try {
      const response = await fetch('/api/account/game-profile', { cache: 'no-store' })
      if (!response.ok) return null
      let data = await response.json()
      let imported = null
      if (!readImported().includes(data.account)) {
        const cache = readCache()
        if (Object.keys(cache).length > 0) {
          const importResponse = await fetch('/api/account/game-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ import: cache }),
          })
          if (!importResponse.ok) return null
          const before = data.profile
          data = await importResponse.json()
          const changes = Object.entries(data.profile).filter(([field, value]) => value && value !== before[field])
          imported = changes.length > 0 ? Object.fromEntries(changes) : null
        }
        markImported(data.account)
      }
      applyAccountToCache(data.profile)
      return imported
    } catch {
      return null
    } finally {
      running = null
    }
  })()
  return running
}

export function rememberProfileField(field, value) {
  for (const [type, link] of Object.entries(LINKS)) {
    if (link.version === field) writeCache(type, 'version', value)
    if (link.loader === field) writeCache(type, 'loader', value)
  }
  window.dispatchEvent(new Event(GAME_PROFILE_EVENT))
}

export async function saveFavoriteToAccount(contentType, kind, value) {
  const link = linkFor(contentType)
  if (!link || !isSigned() || !fits(link, kind, value)) return true
  try {
    const response = await fetch('/api/account/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [link[kind]]: value }),
    })
    return response.ok
  } catch {
    return false
  }
}
