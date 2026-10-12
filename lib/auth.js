import { randomBytes, scrypt, timingSafeEqual, createHash } from 'crypto'
import { cookies } from 'next/headers'
import { getDb } from './db'

export const SESSION_COOKIE = 'mp_session'
const SIGNED_COOKIE = 'mp_signed'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const SCRYPT = { N: 32768, r: 8, p: 3, maxmem: 128 * 1024 * 1024 }
const KEY_LENGTH = 64
const USERNAME_RE = /^[A-Za-z0-9_]{3,24}$/
const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

function derive(password, salt, params) {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, params, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await derive(password, salt, SCRYPT)
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, N, r, p, salt, hash] = parts
  const expected = Buffer.from(hash, 'base64')
  const actual = await derive(password, Buffer.from(salt, 'base64'), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  })
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function validateCredentials(username, password) {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) return 'username'
  if (typeof password !== 'string' || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return 'password'
  }
  return null
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export async function registerUser(username, password) {
  const db = getDb()
  const passwordHash = await hashPassword(password)
  try {
    const result = db
      .prepare('INSERT INTO users (username, username_lower, password_hash, created_at) VALUES (?, ?, ?, ?)')
      .run(username, username.toLowerCase(), passwordHash, Date.now())
    return { id: Number(result.lastInsertRowid), username }
  } catch (error) {
    if (String(error?.code).startsWith('SQLITE_CONSTRAINT')) return null
    throw error
  }
}

export async function authenticateUser(username, password) {
  const user = getDb()
    .prepare('SELECT id, username, password_hash FROM users WHERE username_lower = ?')
    .get(String(username || '').toLowerCase())
  if (!user) {
    await hashPassword(String(password || ''))
    return null
  }
  const ok = await verifyPassword(String(password || ''), user.password_hash)
  return ok ? { id: user.id, username: user.username } : null
}

export function startSession(userId) {
  const token = randomBytes(32).toString('base64url')
  const now = Date.now()
  const db = getDb()
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now)
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    hashToken(token),
    userId,
    now,
    now + SESSION_TTL_MS,
  )
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
  cookies().set(SIGNED_COOKIE, '1', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

export function endSession() {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (token) getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
  cookies().delete(SESSION_COOKIE)
  cookies().delete(SIGNED_COOKIE)
}

export function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token || token.length > 128) return null
  const row = getDb()
    .prepare(
      `SELECT users.id, users.username, users.created_at
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(hashToken(token), Date.now())
  return row || null
}

export function isSameOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}
