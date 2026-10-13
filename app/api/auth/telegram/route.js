import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { externalUsername, resolveExternalSignIn } from '@/lib/externalAccounts'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { safeNext } from '@/lib/safeNext'
import { telegramBotId, verifyTelegramAuth } from '@/lib/telegramAuth'

export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })
  if (!telegramBotId()) return Response.json({ error: 'telegram' }, { status: 404 })

  const ip = getClientIp(request)
  const rate = checkRateLimit(`auth-telegram:${ip}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  const identity = verifyTelegramAuth(body?.auth)
  if (!identity) return Response.json({ error: 'telegram' }, { status: 400 })

  const result = resolveExternalSignIn('telegram', identity, {
    currentUser: getSessionUser(),
    ip,
    next: safeNext(body?.next),
  })

  if (result === 'session' || result === 'linked') return Response.json({ result })
  if (result === 'held') return Response.json({ result, name: externalUsername(identity.login) })
  if (result === 'taken') return Response.json({ error: 'taken' }, { status: 409 })
  if (result === 'signup_limit') return Response.json({ error: 'signup_limit' }, { status: 429 })
  return Response.json({ error: 'telegram' }, { status: 500 })
}
