import { isSameOrigin } from '@/lib/auth'
import { createFromHeldIdentity } from '@/lib/externalAccounts'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const ip = getClientIp(request)
  const rate = checkRateLimit(`auth-claim:${ip}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const result = createFromHeldIdentity(ip)
  if (result === 'session') return Response.json({ result })
  if (result === 'signup_limit') return Response.json({ error: 'signup_limit' }, { status: 429 })
  if (result === 'missing') return Response.json({ error: 'generic' }, { status: 400 })
  return Response.json({ error: 'generic' }, { status: 500 })
}
