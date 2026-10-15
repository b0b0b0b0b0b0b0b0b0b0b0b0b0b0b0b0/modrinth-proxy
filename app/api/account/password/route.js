import { changePassword, getSessionUser, isSameOrigin, isValidPassword } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const USER_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 }
const IP_LIMIT = { limit: 20, windowMs: 15 * 60 * 1000 }

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const current = typeof body?.current === 'string' ? body.current.slice(0, 256) : ''
  const next = body?.next
  if (!isValidPassword(next)) return Response.json({ error: 'password' }, { status: 400 })

  if (!checkRateLimit(`account-password:${user.id}`, USER_LIMIT).ok) {
    return Response.json({ error: 'rate_limit' }, { status: 429 })
  }
  if (!checkRateLimit(`account-password-ip:${getClientIp(request)}`, IP_LIMIT).ok) {
    return Response.json({ error: 'rate_limit' }, { status: 429 })
  }

  const result = await changePassword(user.id, current, next)
  if (result !== 'ok') return Response.json({ error: 'current' }, { status: 400 })
  return Response.json({ ok: true })
}
