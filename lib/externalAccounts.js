import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { startSession } from './auth'
import { recordSignup, signupAllowed } from './captcha'
import { getDb, getMeta, setMeta } from './db'
import { safeNext } from './safeNext'

const COLUMNS = { github: 'github_id', telegram: 'telegram_id' }
const HELD_COOKIE = 'mp_gh_held'
const HELD_TTL_S = 15 * 60
const USERNAME_MAX = 24
const USERNAME_MIN = 3
const USERNAME_ATTEMPTS = 6

export function externalUsername(login) {
  return login.replace(/[^A-Za-z0-9_]/g, '_').slice(0, USERNAME_MAX).padEnd(USERNAME_MIN, '_')
}

function usernameTaken(username) {
  return Boolean(getDb().prepare('SELECT 1 FROM users WHERE username_lower = ?').get(username.toLowerCase()))
}

function findUserByExternal(provider, externalId) {
  return (
    getDb().prepare(`SELECT id, username FROM users WHERE ${COLUMNS[provider]} = ?`).get(externalId) || null
  )
}

function linkExternal(provider, userId, externalId) {
  const owner = findUserByExternal(provider, externalId)
  if (owner) return owner.id === userId
  const column = COLUMNS[provider]
  const result = getDb()
    .prepare(`UPDATE users SET ${column} = ? WHERE id = ? AND ${column} IS NULL`)
    .run(externalId, userId)
  return result.changes === 1
}

function usernameCandidates(login) {
  const base = externalUsername(login)
  const short = base.slice(0, USERNAME_MAX - 5)
  return [base, ...Array.from({ length: USERNAME_ATTEMPTS - 1 }, () => `${short}_${randomInt(1000, 10000)}`)]
}

function registerExternalUser(provider, externalId, login) {
  const insert = getDb().prepare(
    `INSERT INTO users (username, username_lower, password_hash, created_at, ${COLUMNS[provider]}) VALUES (?, ?, '', ?, ?)`,
  )
  for (const username of usernameCandidates(login)) {
    try {
      const result = insert.run(username, username.toLowerCase(), Date.now(), externalId)
      return { id: Number(result.lastInsertRowid), username }
    } catch (error) {
      if (!String(error?.code).startsWith('SQLITE_CONSTRAINT')) throw error
      const existing = findUserByExternal(provider, externalId)
      if (existing) return existing
    }
  }
  return null
}

function heldSignature(payload) {
  let secret = getMeta('github_held_secret')
  if (!secret) {
    secret = randomBytes(32).toString('hex')
    setMeta('github_held_secret', secret)
  }
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function holdIdentity(provider, identity, next) {
  const payload = Buffer.from(
    JSON.stringify({
      provider,
      id: identity.id,
      login: identity.login,
      next: next || '',
      exp: Date.now() + HELD_TTL_S * 1000,
    }),
  ).toString('base64url')
  cookies().set(HELD_COOKIE, `${payload}.${heldSignature(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: HELD_TTL_S,
  })
}

export function heldIdentity() {
  const [payload, signature] = (cookies().get(HELD_COOKIE)?.value || '').split('.')
  if (!payload || !signature) return null
  const expected = Buffer.from(heldSignature(payload))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  let data
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!Number.isSafeInteger(data?.id) || typeof data.login !== 'string' || !(data.exp > Date.now())) return null
  return {
    provider: Object.hasOwn(COLUMNS, data.provider) ? data.provider : 'github',
    id: data.id,
    login: data.login,
    username: externalUsername(data.login),
    next: safeNext(data.next),
  }
}

export function releaseIdentity() {
  cookies().set(HELD_COOKIE, '', { path: '/', maxAge: 0 })
}

export function linkHeldIdentity(userId) {
  const held = heldIdentity()
  if (!held) return
  linkExternal(held.provider, userId, held.id)
  releaseIdentity()
}

export function createFromHeldIdentity(ip) {
  const held = heldIdentity()
  if (!held) return 'missing'
  let user = findUserByExternal(held.provider, held.id)
  if (!user) {
    if (!signupAllowed(ip)) return 'signup_limit'
    user = registerExternalUser(held.provider, held.id, held.login)
    if (!user) return 'error'
    recordSignup(ip)
  }
  releaseIdentity()
  startSession(user.id)
  return 'session'
}

export function resolveExternalSignIn(provider, identity, { currentUser, ip, next }) {
  if (currentUser) return linkExternal(provider, currentUser.id, identity.id) ? 'linked' : 'taken'

  let user = findUserByExternal(provider, identity.id)
  if (!user) {
    if (usernameTaken(externalUsername(identity.login))) {
      holdIdentity(provider, identity, next)
      return 'held'
    }
    if (!signupAllowed(ip)) return 'signup_limit'
    user = registerExternalUser(provider, identity.id, identity.login)
    if (!user) return 'error'
    recordSignup(ip)
  }

  startSession(user.id)
  return 'session'
}
