import { randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { safeNext } from './safeNext'
import { SITE_ORIGIN } from './site'

const STATE_COOKIE = 'mp_dc_state'
const STATE_PATH = '/api/auth/discord'
const STATE_TTL_S = 10 * 60
const NEXT_MAX = 512
const TIMEOUT_MS = 8000
const USER_AGENT = 'modrinth.black-auth'
const API = 'https://discord.com/api/v10'

function credentials() {
  return {
    id: process.env.DISCORD_OAUTH_CLIENT_ID || '',
    secret: process.env.DISCORD_OAUTH_CLIENT_SECRET || '',
    redirect: process.env.DISCORD_OAUTH_REDIRECT_URI || `${SITE_ORIGIN}/api/auth/discord/callback`,
  }
}

export function discordAuthEnabled() {
  const { id, secret } = credentials()
  return Boolean(id && secret)
}

export async function beginDiscordAuth(next) {
  const state = randomBytes(24).toString('base64url')
  const target = safeNext(next) || ''
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, `${state}.${target.length <= NEXT_MAX ? target : ''}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: STATE_PATH,
    maxAge: STATE_TTL_S,
  })
  const { id, redirect } = credentials()
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'identify',
    state,
    prompt: 'none',
  })
  return `https://discord.com/oauth2/authorize?${params}`
}

export async function consumeDiscordState(state) {
  const cookieStore = await cookies()
  const stored = cookieStore.get(STATE_COOKIE)?.value || ''
  cookieStore.set(STATE_COOKIE, '', { path: STATE_PATH, maxAge: 0 })
  const separator = stored.indexOf('.')
  if (separator <= 0 || typeof state !== 'string') return null
  const expected = Buffer.from(stored.slice(0, separator))
  const actual = Buffer.from(state)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  return { next: safeNext(stored.slice(separator + 1)) }
}

export async function fetchDiscordIdentity(code) {
  const { id, secret, redirect } = credentials()
  try {
    const tokenResponse = await fetch(`${API}/oauth2/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: new URLSearchParams({
        client_id: id,
        client_secret: secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirect,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const token = (await tokenResponse.json().catch(() => null))?.access_token
    if (typeof token !== 'string' || !token) return null

    const userResponse = await fetch(`${API}/users/@me`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': USER_AGENT },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!userResponse.ok) return null
    const profile = await userResponse.json().catch(() => null)
    if (typeof profile?.id !== 'string' || !/^\d{1,20}$/.test(profile.id)) return null
    if (typeof profile.username !== 'string' || !profile.username) return null
    return { id: profile.id, login: profile.username }
  } catch {
    return null
  }
}
