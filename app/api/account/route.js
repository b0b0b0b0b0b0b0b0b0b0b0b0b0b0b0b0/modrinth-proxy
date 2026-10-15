import { deleteAccount, getSessionUser, isSameOrigin } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 }

export const dynamic = 'force-dynamic'

export async function DELETE(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-delete:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (body?.confirm !== 'delete-my-account') return Response.json({ error: 'bad_request' }, { status: 400 })

  deleteAccount(user.id)
  return Response.json({ ok: true })
}
