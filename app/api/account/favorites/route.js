import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { clearFavorites, getFavoriteCounts, isProjectId, setFavorite } from '@/lib/account'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 120, windowMs: 60_000 }

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const ids = (new URL(request.url).searchParams.get('ids') || '').split(',').slice(0, 100)
  return Response.json(getFavoriteCounts(ids))
}

export async function DELETE(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-favorites-delete:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (body?.all === true) return Response.json({ removed: clearFavorites(user.id) })
  if (!isProjectId(body?.projectId)) return Response.json({ error: 'bad_request' }, { status: 400 })

  setFavorite(user.id, body.projectId, false)
  return Response.json({ removed: 1 })
}
