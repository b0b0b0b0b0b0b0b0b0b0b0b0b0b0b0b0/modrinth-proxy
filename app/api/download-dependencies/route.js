import { isSameOrigin } from '@/lib/auth'
import { createDownloadDependencyResolver } from '@/lib/downloadDependencies'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 10, windowMs: 60_000 }
const MAX_DEPENDENCIES = 100
const ID_RE = /^[A-Za-z0-9]{1,32}$/
const LOADER_RE = /^[a-z0-9_-]{1,32}$/i
const GAME_VERSION_RE = /^[\w.+-]{1,32}$/
const TYPES = new Set(['required', 'optional', 'embedded', 'incompatible'])

function cleanDependency(dep) {
  if (!dep || typeof dep !== 'object') return null
  const out = { dependency_type: dep.dependency_type }
  if (!TYPES.has(out.dependency_type)) return null
  if (dep.project_id != null) {
    if (!ID_RE.test(String(dep.project_id))) return null
    out.project_id = String(dep.project_id)
  }
  if (dep.version_id != null) {
    if (!ID_RE.test(String(dep.version_id))) return null
    out.version_id = String(dep.version_id)
  }
  if (dep.file_name != null) {
    if (typeof dep.file_name !== 'string' || dep.file_name.length > 255) return null
    out.file_name = dep.file_name
  }
  return out
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })
  if (!checkRateLimit(`download-deps:${getClientIp(request)}`, RATE_LIMIT).ok) {
    return Response.json({ error: 'rate_limit' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }
  const { dependencies, loader, gameVersion } = body || {}
  if (typeof loader !== 'string' || typeof gameVersion !== 'string' || !LOADER_RE.test(loader) || !GAME_VERSION_RE.test(gameVersion)) {
    return Response.json({ error: 'loader and gameVersion required' }, { status: 400 })
  }
  if (!Array.isArray(dependencies)) return Response.json({ error: 'dependencies required' }, { status: 400 })
  if (dependencies.length > MAX_DEPENDENCIES * 5) return Response.json({ error: 'too_many' }, { status: 413 })
  const clean = dependencies
    .map(cleanDependency)
    .filter((dep) => dep && dep.dependency_type !== 'incompatible')
    .slice(0, MAX_DEPENDENCIES)

  const resolver = createDownloadDependencyResolver()
  try {
    const fullTree = await resolver.resolveTree(clean, { loader, gameVersion, maxDepth: resolver.fullMaxNestingDepth })
    const tree = resolver.trimTree(fullTree)
    const files = resolver.flattenTreeDeduped(fullTree)
    const partial = Boolean(resolver.client.truncated)
    return Response.json({ tree, files, partial }, {
      headers: {
        'Cache-Control': partial ? 'no-store' : 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return Response.json({ error: 'failed to resolve dependencies' }, { status: 502 })
  }
}
