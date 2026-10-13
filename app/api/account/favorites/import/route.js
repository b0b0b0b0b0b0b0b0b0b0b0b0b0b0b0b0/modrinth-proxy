import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { importFavorites, parseFavoritesCode } from '@/lib/account'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 }

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const ids = parseFavoritesCode(body?.code)
  if (!ids) return Response.json({ error: 'bad_code' }, { status: 400 })

  const rate = checkRateLimit(`account-favorites-import:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  return Response.json(await importFavorites(user.id, ids))
}
