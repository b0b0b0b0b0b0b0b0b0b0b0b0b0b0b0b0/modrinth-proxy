import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { buildFavoritesCode, getFavorites } from '@/lib/account'
import { checkRateLimit } from '@/lib/rateLimit'
import { pruneSharedLists, shareList } from '@/lib/sharedLists'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }
const PRUNE_CHANCE = 0.05

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-favorites-link:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const favorites = getFavorites(user.id)
  if (favorites.length === 0) return Response.json({ error: 'empty' }, { status: 400 })

  if (Math.random() < PRUNE_CHANCE) pruneSharedLists()

  const id = shareList(buildFavoritesCode(favorites.map((row) => row.project_id)))
  if (!id) return Response.json({ error: 'failed' }, { status: 500 })
  return Response.json({ id })
}
