import { createHash, createHmac, timingSafeEqual } from 'crypto'

const TOKEN_RE = /^(\d{5,15}):[A-Za-z0-9_-]{30,}$/
const HASH_RE = /^[a-f0-9]{64}$/
const AUTH_MAX_AGE_S = 10 * 60
const CLOCK_SKEW_S = 60
const MAX_FIELDS = 12
const MAX_VALUE = 512

function botToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN || ''
  return TOKEN_RE.test(token) ? token : ''
}

export function telegramBotId() {
  return TOKEN_RE.exec(botToken())?.[1] || null
}

function usedHashes() {
  if (!globalThis.__telegramUsedHashes) globalThis.__telegramUsedHashes = new Map()
  return globalThis.__telegramUsedHashes
}

export function verifyTelegramAuth(data) {
  const token = botToken()
  if (!token || !data || typeof data !== 'object' || Array.isArray(data)) return null

  const hash = typeof data.hash === 'string' ? data.hash : ''
  if (!HASH_RE.test(hash)) return null

  const keys = Object.keys(data).filter((key) => key !== 'hash').sort()
  if (keys.length === 0 || keys.length > MAX_FIELDS) return null
  const lines = []
  for (const key of keys) {
    const value = data[key]
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return null
    const text = String(value)
    if (text.length > MAX_VALUE || !/^[a-z_]{1,32}$/.test(key)) return null
    lines.push(`${key}=${text}`)
  }

  const secret = createHash('sha256').update(token).digest()
  const expected = Buffer.from(createHmac('sha256', secret).update(lines.join('\n')).digest('hex'))
  const actual = Buffer.from(hash)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

  const id = Number(data.id)
  const authDate = Number(data.auth_date)
  const now = Math.floor(Date.now() / 1000)
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(authDate)) return null
  if (authDate > now + CLOCK_SKEW_S || now - authDate > AUTH_MAX_AGE_S) return null

  const used = usedHashes()
  for (const [key, expires] of used) {
    if (expires < now) used.delete(key)
  }
  if (used.has(hash)) return null
  used.set(hash, authDate + AUTH_MAX_AGE_S)

  const username = typeof data.username === 'string' ? data.username : ''
  return { id, login: username || `tg_${id}` }
}
