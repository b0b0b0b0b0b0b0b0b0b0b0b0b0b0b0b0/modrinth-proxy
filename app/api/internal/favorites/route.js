import { getUserBySessionToken } from '@/lib/auth'
import { importFavorites, isProjectId } from '@/lib/account'
import { isInternalRequest } from '@/lib/internalApi'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 32 * 1024
const MAX_IDS = 200
const RATE_LIMIT = { limit: 12, windowMs: 10 * 60 * 1000 }
const NO_STORE = { 'Cache-Control': 'private, no-store' }

function reply(body, status = 200) {
  return Response.json(body, { status, headers: NO_STORE })
}

async function readBody(request) {
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > MAX_BODY_BYTES) return null
  const text = await request.text().catch(() => null)
  if (!text || text.length > MAX_BODY_BYTES) return null
  try {
    const body = JSON.parse(text)
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

export async function POST(request) {
  if (!isInternalRequest(request)) return new Response(null, { status: 404 })
  const body = await readBody(request)
  if (!body || body.action !== 'track' || !Array.isArray(body.projectIds)) return reply({ error: 'bad_request' }, 400)
  const user = getUserBySessionToken(body.token)
  if (!user) return reply({ error: 'unauthorized' }, 401)

  const ids = [...new Set(body.projectIds.filter(isProjectId))].slice(0, MAX_IDS)
  if (!ids.length) return reply({ added: 0, existing: 0, missing: 0 })

  const rate = checkRateLimit(`internal-favorites-track:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return reply({ error: 'rate_limited' }, 429)

  return reply(await importFavorites(user.id, ids))
}
