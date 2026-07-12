import { getMod, getVersionFromFileHash } from '@/lib/modrinth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const HASH_LENGTH = {
  sha1: 40,
  sha256: 64,
  sha512: 128,
}

const RATE_LIMIT = { limit: 20, windowMs: 60_000 }
const RESULT_CACHE_MS = 5 * 60 * 1000
const resultCache = new Map()

function isValidHash(hash, algorithm) {
  const expected = HASH_LENGTH[algorithm]
  if (!expected) return false
  return /^[a-f0-9]+$/i.test(hash) && hash.length === expected
}

function cacheKey(hash, algorithm) {
  return `${algorithm}:${hash.toLowerCase()}`
}

function getCachedResult(key) {
  const entry = resultCache.get(key)
  if (!entry || Date.now() - entry.at >= RESULT_CACHE_MS) {
    resultCache.delete(key)
    return null
  }
  return entry.data
}

function setCachedResult(key, data) {
  resultCache.set(key, { at: Date.now(), data })
  if (resultCache.size > 500) {
    const oldest = resultCache.keys().next().value
    resultCache.delete(oldest)
  }
}

export async function GET(request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`file-lookup:${ip}`, RATE_LIMIT)

  if (!rate.ok) {
    const retryAfterSec = Math.max(1, Math.ceil(rate.resetMs / 1000))
    return Response.json(
      { error: 'rate_limit' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(rate.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  const { searchParams } = new URL(request.url)
  const hash = searchParams.get('hash')?.trim()
  const algorithm = (searchParams.get('algorithm') || 'sha512').trim().toLowerCase()

  if (!hash || !isValidHash(hash, algorithm)) {
    return Response.json({ error: 'Invalid hash' }, { status: 400 })
  }

  const key = cacheKey(hash, algorithm)
  const cached = getCachedResult(key)
  if (cached) {
    return Response.json(cached, {
      headers: {
        'X-RateLimit-Limit': String(rate.limit),
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    })
  }

  try {
    const version = await getVersionFromFileHash(hash, algorithm)
    if (!version) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const project = await getMod(version.project_id)
    if (!project) {
      return Response.json({ error: 'project_not_found' }, { status: 404 })
    }

    const payload = {
      version: {
        id: version.id,
        project_id: version.project_id,
        version_number: version.version_number,
        name: version.name,
        version_type: version.version_type,
        game_versions: version.game_versions,
        loaders: version.loaders,
        downloads: version.downloads,
        files: version.files,
      },
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        project_type: project.project_type,
        icon_url: project.icon_url,
      },
    }

    setCachedResult(key, payload)

    return Response.json(payload, {
      headers: {
        'X-RateLimit-Limit': String(rate.limit),
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    })
  } catch (error) {
    console.error('File lookup failed:', error)
    return Response.json({ error: 'lookup_failed' }, { status: 502 })
  }
}
