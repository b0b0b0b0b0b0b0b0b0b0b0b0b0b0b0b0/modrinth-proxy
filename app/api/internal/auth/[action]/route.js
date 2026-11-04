import {
  authenticateUser,
  createSession,
  getUserBySessionToken,
  isValidUsername,
  registerUser,
  renameUser,
  revokeSessionToken,
  validateCredentials,
} from '@/lib/auth'
import { clearLoginFailures, createCaptcha, recordLoginFailure, recordSignup, signupAllowed, verifyCaptcha } from '@/lib/captcha'
import { isInternalRequest } from '@/lib/internalApi'
import { absoluteAvatarUrl, userAvatarUrl } from '@/lib/minecraftAvatar'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const LIMITS = {
  captcha: { limit: 40, windowMs: 60_000 },
  login: { limit: 10, windowMs: 10 * 60 * 1000 },
  register: { limit: 10, windowMs: 60 * 60 * 1000 },
  rename: { limit: 5, windowMs: 60 * 60 * 1000 },
}

const fail = (error, status) => Response.json({ error }, { status })

function clientIp(value) {
  return typeof value === 'string' && /^[0-9a-fA-F:.]{2,45}$/.test(value) ? value : 'unknown'
}

function publicUser(user) {
  return { id: user.id, username: user.username, mcName: user.mc_name || null, avatar: absoluteAvatarUrl(userAvatarUrl(user)) }
}

function issue(userId) {
  const session = createSession(userId)
  return Response.json({ ...session, user: publicUser(getUserBySessionToken(session.token)) })
}

async function login(body, ip) {
  if (!checkRateLimit(`auth-login:${ip}`, LIMITS.login).ok) return fail('rate_limit', 429)
  if (body?.website) return fail('invalid', 401)
  if (!verifyCaptcha(body?.captcha, 'login', ip)) return fail('captcha', 400)
  const username = typeof body?.username === 'string' ? body.username.trim().slice(0, 64) : ''
  const password = typeof body?.password === 'string' ? body.password.slice(0, 256) : ''
  const user = await authenticateUser(username, password)
  if (!user) {
    recordLoginFailure(ip)
    return fail('invalid', 401)
  }
  clearLoginFailures(ip)
  return issue(user.id)
}

async function register(body, ip) {
  if (!checkRateLimit(`auth-register:${ip}`, LIMITS.register).ok) return fail('rate_limit', 429)
  if (body?.website) return fail('forbidden', 403)
  if (!signupAllowed(ip)) return fail('signup_limit', 429)
  if (!verifyCaptcha(body?.captcha, 'register', ip)) return fail('captcha', 400)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const invalid = validateCredentials(username, body?.password)
  if (invalid) return fail(invalid, 400)
  const user = await registerUser(username, body.password)
  if (!user) return fail('taken', 409)
  recordSignup(ip)
  return issue(user.id)
}

function rename(body) {
  const user = getUserBySessionToken(body?.token)
  if (!user) return fail('unauthorized', 401)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  if (!isValidUsername(username)) return fail('username', 400)
  if (username === user.username) return Response.json({ user: publicUser(user) })
  if (!checkRateLimit(`account-username:${user.id}`, LIMITS.rename).ok) return fail('rate_limit', 429)
  if (!renameUser(user.id, username)) return fail('taken', 409)
  return Response.json({ user: publicUser(getUserBySessionToken(body.token)) })
}

export async function POST(request, { params }) {
  if (!isInternalRequest(request)) return new Response(null, { status: 404 })
  const { action } = await params
  const body = await request.json().catch(() => null)
  const ip = clientIp(body?.ip)

  if (action === 'captcha') {
    if (!checkRateLimit(`auth-captcha:${ip}`, LIMITS.captcha).ok) return fail('rate_limit', 429)
    const captcha = createCaptcha(body?.mode, ip)
    return captcha ? Response.json(captcha) : fail('bad_request', 400)
  }
  if (action === 'login') return login(body, ip)
  if (action === 'register') return register(body, ip)
  if (action === 'rename') return rename(body)
  if (action === 'logout') {
    revokeSessionToken(body?.token)
    return Response.json({ ok: true })
  }
  return new Response(null, { status: 404 })
}
