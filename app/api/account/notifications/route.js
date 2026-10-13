import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { getRequestLocale } from '@/lib/i18n/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { setTelegramNotify } from '@/lib/telegramBot'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-notifications:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (typeof body?.telegram !== 'boolean') return Response.json({ error: 'bad_request' }, { status: 400 })

  setTelegramNotify(user.id, body.telegram, getRequestLocale())
  return Response.json({ telegram: body.telegram })
}
