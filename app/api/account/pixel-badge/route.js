import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { readPixelBadge, setPixelBadge } from '@/lib/kittenPets'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 30, windowMs: 60 * 1000 }
const NO_STORE = { 'Cache-Control': 'private, no-store' }

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE })
  if (!checkRateLimit(`pixel-badge:${user.id}`, RATE_LIMIT).ok) {
    return Response.json({ error: 'rate' }, { status: 429, headers: NO_STORE })
  }
  const body = await request.json().catch(() => null)
  if (!body || !Object.hasOwn(body, 'choice') || !setPixelBadge(user.id, body.choice)) {
    return Response.json({ error: 'bad_request' }, { status: 400, headers: NO_STORE })
  }
  return Response.json(readPixelBadge(user.id), { headers: NO_STORE })
}
