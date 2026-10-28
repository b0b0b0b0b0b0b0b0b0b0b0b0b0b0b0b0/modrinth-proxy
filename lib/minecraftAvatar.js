import { getDb } from './db'

const NAME_RE = /^[A-Za-z0-9_]{1,16}$/
const UUID_RE = /^[0-9a-f]{32}$/
const AVATAR_PX = 128
const LOOKUP_TIMEOUT_MS = 8000
const PROFILE_TTL_MS = 10 * 60 * 1000
const PROFILE_CACHE_MAX = 2000
const SOURCES = [
  (name) => `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`,
  (name) => `https://api.minecraftservices.com/minecraft/profile/lookup/name/${encodeURIComponent(name)}`,
]

const profileCache = globalThis.__mcProfileCache || (globalThis.__mcProfileCache = new Map())

export function isMinecraftName(value) {
  return typeof value === 'string' && NAME_RE.test(value)
}

function normalizeUuid(value) {
  const id = String(value || '').trim().toLowerCase().replace(/-/g, '')
  return UUID_RE.test(id) ? id : null
}

export function minecraftAvatarUrl(uuid, version = 0) {
  const id = normalizeUuid(uuid)
  if (!id) return null
  return `https://minotar.net/cube/${id}/${AVATAR_PX}.png${version ? `?v=${version}` : ''}`
}

export function userAvatarUrl(user) {
  return user?.mc_uuid ? minecraftAvatarUrl(user.mc_uuid, user.mc_avatar_at) : null
}

function remember(key, value) {
  if (profileCache.size >= PROFILE_CACHE_MAX) profileCache.delete(profileCache.keys().next().value)
  profileCache.set(key, { at: Date.now(), value })
}

async function fetchProfile(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (response.status === 204 || response.status === 404) return { missing: true }
  if (!response.ok) return null
  const body = await response.json().catch(() => null)
  const id = normalizeUuid(body?.id)
  const name = typeof body?.name === 'string' && isMinecraftName(body.name) ? body.name : null
  return id && name ? { profile: { id, name } } : null
}

export async function lookupMinecraftProfile(rawName) {
  const name = String(rawName || '').trim()
  if (!isMinecraftName(name)) return { error: 'invalid' }
  const key = name.toLowerCase()
  const hit = profileCache.get(key)
  if (hit && Date.now() - hit.at < PROFILE_TTL_MS) return hit.value ? { profile: hit.value } : { error: 'not_found' }

  for (const source of SOURCES) {
    try {
      const result = await fetchProfile(source(name))
      if (result?.missing) {
        remember(key, null)
        return { error: 'not_found' }
      }
      if (result?.profile) {
        remember(key, result.profile)
        return { profile: result.profile }
      }
    } catch {}
  }
  return { error: 'mojang' }
}

export function setUserAvatar(userId, profile) {
  const now = Date.now()
  getDb()
    .prepare('UPDATE users SET mc_uuid = ?, mc_name = ?, mc_avatar_at = ? WHERE id = ?')
    .run(profile?.id ?? null, profile?.name ?? null, profile ? now : 0, userId)
  return profile ? minecraftAvatarUrl(profile.id, now) : null
}
