import { randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { safeNext } from './safeNext'

const STATE_COOKIE = 'mp_gh_state'
const STATE_PATH = '/api/auth/github'
const STATE_TTL_S = 10 * 60
const NEXT_MAX = 512
const TIMEOUT_MS = 8000
const USER_AGENT = 'modrinth.black-auth'

function credentials() {
  return {
    id: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    secret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
  }
}

export function githubAuthEnabled() {
  const { id, secret } = credentials()
  return Boolean(id && secret)
}

export function redirectTo(location) {
  return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } })
}

export function beginGithubAuth(next) {
  const state = randomBytes(24).toString('base64url')
  const target = safeNext(next) || ''
  cookies().set(STATE_COOKIE, `${state}.${target.length <= NEXT_MAX ? target : ''}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: STATE_PATH,
    maxAge: STATE_TTL_S,
  })
  const params = new URLSearchParams({ client_id: credentials().id, state, allow_signup: 'true' })
  return `https://github.com/login/oauth/authorize?${params}`
}

export function consumeGithubState(state) {
  const stored = cookies().get(STATE_COOKIE)?.value || ''
  cookies().set(STATE_COOKIE, '', { path: STATE_PATH, maxAge: 0 })
  const separator = stored.indexOf('.')
  if (separator <= 0 || typeof state !== 'string') return null
  const expected = Buffer.from(stored.slice(0, separator))
  const actual = Buffer.from(state)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  return { next: safeNext(stored.slice(separator + 1)) }
}

export async function fetchGithubIdentity(code) {
  const { id, secret } = credentials()
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({ client_id: id, client_secret: secret, code }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const token = (await tokenResponse.json().catch(() => null))?.access_token
    if (typeof token !== 'string' || !token) return null

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': USER_AGENT,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!userResponse.ok) return null
    const profile = await userResponse.json().catch(() => null)
    if (!Number.isSafeInteger(profile?.id) || typeof profile.login !== 'string') return null
    return { id: profile.id, login: profile.login }
  } catch {
    return null
  }
}
