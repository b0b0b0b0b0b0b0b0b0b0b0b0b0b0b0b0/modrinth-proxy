import { randomBytes, scrypt, timingSafeEqual, createHash } from 'crypto'
import { cookies } from 'next/headers'
import { getDb } from './db'
import { getRequestLocale } from './i18n/server'

export const SESSION_COOKIE = 'mp_session'
const SIGNED_COOKIE = 'mp_signed'
const NEWS_OFF_COOKIE = 'mp_news_off'
export const FESTIVE_OFF_COOKIE = 'mp_festive_off'
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

export function isValidUsername(username) {
  return typeof username === 'string' && USERNAME_RE.test(username)
}

export function renameUser(userId, username) {
  try {
    const result = getDb()
      .prepare('UPDATE users SET username = ?, username_lower = ? WHERE id = ?')
      .run(username, username.toLowerCase(), userId)
    return result.changes === 1
  } catch (error) {
    if (String(error?.code).startsWith('SQLITE_CONSTRAINT')) return false
    throw error
  }
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX
}

export async function changePassword(userId, currentPassword, nextPassword) {
  const db = getDb()
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId)
  if (!row) return 'invalid'
  if (row.password_hash) {
    const ok = await verifyPassword(String(currentPassword || ''), row.password_hash)
    if (!ok) return 'invalid'
  }
  const passwordHash = await hashPassword(nextPassword)
  const keepToken = hashToken(cookies().get(SESSION_COOKIE)?.value || '')
  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId)
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, keepToken)
  })()
  return 'ok'
}

export function validateCredentials(username, password) {
  if (!isValidUsername(username)) return 'username'
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
  db.prepare('UPDATE users SET locale = ? WHERE id = ?').run(getRequestLocale(), userId)
  const prefs = db.prepare('SELECT hide_news_badge, hide_festive FROM users WHERE id = ?').get(userId)
  setNewsBadgeCookie(!prefs?.hide_news_badge)
  setFestiveCookie(!prefs?.hide_festive)
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

export function setFestiveCookie(shown) {
  if (shown) {
    cookies().delete(FESTIVE_OFF_COOKIE)
    return
  }
  cookies().set(FESTIVE_OFF_COOKIE, '1', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

export function setNewsBadgeCookie(shown) {
  if (shown) {
    cookies().delete(NEWS_OFF_COOKIE)
    return
  }
  cookies().set(NEWS_OFF_COOKIE, '1', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

export function deleteAccount(userId) {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(userId)
  cookies().delete(SESSION_COOKIE)
  cookies().delete(SIGNED_COOKIE)
  cookies().delete(NEWS_OFF_COOKIE)
  cookies().delete(FESTIVE_OFF_COOKIE)
}

export function endSession() {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (token) getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
  cookies().delete(SESSION_COOKIE)
  cookies().delete(SIGNED_COOKIE)
  cookies().delete(NEWS_OFF_COOKIE)
  cookies().delete(FESTIVE_OFF_COOKIE)
}

export function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token || token.length > 128) return null
  const row = getDb()
    .prepare(
      `SELECT users.id, users.username, users.created_at, users.github_id, users.telegram_id, users.telegram_notify, users.skip_download_updates, users.record_history, users.hide_news_badge, users.hide_festive,
         users.password_hash != '' AS has_password
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
