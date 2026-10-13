import { getSessionUser, isSameOrigin, isValidUsername, renameUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  if (!isValidUsername(username)) return Response.json({ error: 'username' }, { status: 400 })
  if (username === user.username) return Response.json({ user: { username } })

  const rate = checkRateLimit(`account-username:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  if (!renameUser(user.id, username)) return Response.json({ error: 'taken' }, { status: 409 })
  return Response.json({ user: { username } })
}
