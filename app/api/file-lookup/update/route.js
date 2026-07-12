import { getVersionUpdateFromHash } from '@/lib/modrinth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const HASH_LENGTH = {
  sha1: 40,
  sha256: 64,
  sha512: 128,
}

const RATE_LIMIT = { limit: 20, windowMs: 60_000 }
const RESULT_CACHE_MS = 5 * 60 * 1000
const updateCache = new Map()

function isValidHash(hash, algorithm) {
  const expected = HASH_LENGTH[algorithm]
  if (!expected) return false
  return /^[a-f0-9]+$/i.test(hash) && hash.length === expected
}

function cacheKey(hash, algorithm, loaders, gameVersions) {
  const loaderKey = [...loaders].sort().join(',')
  const gameKey = [...gameVersions].sort().join(',')
  return `${algorithm}:${hash.toLowerCase()}:${loaderKey}:${gameKey}`
}

function getCachedResult(key) {
  const entry = updateCache.get(key)
  if (!entry || Date.now() - entry.at >= RESULT_CACHE_MS) {
    updateCache.delete(key)
    return null
  }
  return entry.data
}

function setCachedResult(key, data) {
  updateCache.set(key, { at: Date.now(), data })
  if (updateCache.size > 500) {
    const oldest = updateCache.keys().next().value
    updateCache.delete(oldest)
  }
}

function pickPrimaryFile(files) {
  if (!Array.isArray(files) || files.length === 0) return null
  return files.find((file) => file?.primary) || files[0]
}

export async function POST(request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`file-lookup-update:${ip}`, RATE_LIMIT)

  if (!rate.ok) {
    const retryAfterSec = Math.max(1, Math.ceil(rate.resetMs / 1000))
    return Response.json(
      { error: 'rate_limit' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSec) },
      },
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const hash = body?.hash?.trim()
  const algorithm = (body?.algorithm || 'sha512').trim().toLowerCase()
  const loaders = Array.isArray(body?.loaders) ? body.loaders.filter(Boolean) : []
  const gameVersions = Array.isArray(body?.game_versions)
    ? body.game_versions.filter(Boolean)
    : []
  const currentVersionId = body?.current_version_id?.trim() || null

  if (!hash || !isValidHash(hash, algorithm)) {
    return Response.json({ error: 'Invalid hash' }, { status: 400 })
  }

  if (loaders.length === 0 || gameVersions.length === 0) {
    return Response.json({ error: 'loaders and game_versions required' }, { status: 400 })
  }

  const key = cacheKey(hash, algorithm, loaders, gameVersions)
  const cached = getCachedResult(key)
  if (cached) {
    return Response.json(cached)
  }

  try {
    const latest = await getVersionUpdateFromHash(hash, algorithm, {
      loaders,
      game_versions: gameVersions,
    })

    if (!latest) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const latestFile = pickPrimaryFile(latest.files)
    const updateAvailable = currentVersionId
      ? latest.id !== currentVersionId
      : true

    const payload = {
      update_available: updateAvailable,
      latest_version: {
        id: latest.id,
        version_number: latest.version_number,
        name: latest.name,
        version_type: latest.version_type,
        game_versions: latest.game_versions,
        loaders: latest.loaders,
        date_published: latest.date_published,
      },
      latest_file: latestFile
        ? {
            filename: latestFile.filename,
            url: latestFile.url,
            size: latestFile.size,
            hashes: latestFile.hashes,
          }
        : null,
    }

    setCachedResult(key, payload)
    return Response.json(payload)
  } catch (error) {
    console.error('File update check failed:', error)
    return Response.json({ error: 'update_failed' }, { status: 502 })
  }
}
