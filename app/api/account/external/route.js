import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { unlinkExternal } from '@/lib/externalAccounts'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 }

export const dynamic = 'force-dynamic'

export async function DELETE(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-external:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  const result = unlinkExternal(body?.provider, user.id)
  if (result === 'ok') return Response.json({ ok: true })
  if (result === 'last') return Response.json({ error: 'last' }, { status: 409 })
  return Response.json({ error: 'bad_request' }, { status: 400 })
}
