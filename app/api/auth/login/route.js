import { authenticateUser, isSameOrigin, startSession } from '@/lib/auth'
import { clearLoginFailures, recordLoginFailure, verifyCaptcha } from '@/lib/captcha'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 }

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const ip = getClientIp(request)
  const rate = checkRateLimit(`auth-login:${ip}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (body?.website) return Response.json({ error: 'invalid' }, { status: 401 })
  if (!verifyCaptcha(body?.captcha, 'login', ip)) return Response.json({ error: 'captcha' }, { status: 400 })

  const username = typeof body?.username === 'string' ? body.username.trim().slice(0, 64) : ''
  const password = typeof body?.password === 'string' ? body.password.slice(0, 256) : ''

  const user = await authenticateUser(username, password)
  if (!user) {
    recordLoginFailure(ip)
    return Response.json({ error: 'invalid' }, { status: 401 })
  }

  clearLoginFailures(ip)
  startSession(user.id)
  return Response.json({ user: { username: user.username } })
}
