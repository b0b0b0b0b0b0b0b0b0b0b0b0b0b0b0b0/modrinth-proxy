import { isSameOrigin, registerUser, startSession, validateCredentials } from '@/lib/auth'
import { recordSignup, signupAllowed, verifyCaptcha } from '@/lib/captcha'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const ip = getClientIp(request)
  const rate = checkRateLimit(`auth-register:${ip}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (body?.website) return Response.json({ error: 'forbidden' }, { status: 403 })
  if (!signupAllowed(ip)) return Response.json({ error: 'signup_limit' }, { status: 429 })
  if (!verifyCaptcha(body?.captcha, 'register', ip)) return Response.json({ error: 'captcha' }, { status: 400 })

  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = body?.password
  const invalid = validateCredentials(username, password)
  if (invalid) return Response.json({ error: invalid }, { status: 400 })

  const user = await registerUser(username, password)
  if (!user) return Response.json({ error: 'taken' }, { status: 409 })

  recordSignup(ip)
  startSession(user.id)
  return Response.json({ user: { username: user.username } })
}
