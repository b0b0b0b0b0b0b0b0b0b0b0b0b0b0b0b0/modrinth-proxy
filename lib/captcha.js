import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { getDb, getMeta, setMeta } from './db'

const DAY_MS = 24 * 60 * 60 * 1000
const CHALLENGE_TTL_MS = 5 * 60 * 1000
const FAILURE_WINDOW_MS = 15 * 60 * 1000
const LOGIN_BASE_BITS = 18
const LOGIN_MAX_BITS = 24
const REGISTER_BASE_BITS = 19
const REGISTER_MAX_BITS = 24
const LOGIN_BITS_PER_FAILURE = 2
const SIGNUPS_PER_IP_PER_DAY = 3
const SIGNUPS_PER_SUBNET_PER_DAY = 10
const MODES = new Set(['login', 'register'])

function getState() {
  if (!globalThis.__captchaState) {
    globalThis.__captchaState = { used: new Map(), failures: new Map(), secret: null }
  }
  return globalThis.__captchaState
}

function getSecret() {
  const state = getState()
  if (!state.secret) {
    let secret = getMeta('captcha_secret')
    if (!secret) {
      secret = randomBytes(32).toString('hex')
      setMeta('captcha_secret', secret)
    }
    state.secret = secret
  }
  return state.secret
}

function sign(value) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  return left.length === right.length && timingSafeEqual(left, right)
}

function subnetOf(ip) {
  const value = String(ip || 'unknown').trim().toLowerCase()
  const v4 = value.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/)
  if (v4) return `${v4[1]}.${v4[2]}.${v4[3]}`
  if (value.includes(':')) return value.split(':').slice(0, 4).join(':')
  return value
}

function networkKeys(ip) {
  return { ipKey: sign(`ip:${ip}`), subnetKey: sign(`subnet:${subnetOf(ip)}`) }
}

function recentSignups(ip) {
  const { ipKey, subnetKey } = networkKeys(ip)
  const since = Date.now() - DAY_MS
  const db = getDb()
  return {
    byIp: db.prepare('SELECT COUNT(*) AS n FROM signup_log WHERE ip_key = ? AND created_at > ?').get(ipKey, since).n,
    bySubnet: db
      .prepare('SELECT COUNT(*) AS n FROM signup_log WHERE subnet_key = ? AND created_at > ?')
      .get(subnetKey, since).n,
  }
}

export function signupAllowed(ip) {
  const { byIp, bySubnet } = recentSignups(ip)
  return byIp < SIGNUPS_PER_IP_PER_DAY && bySubnet < SIGNUPS_PER_SUBNET_PER_DAY
}

export function recordSignup(ip) {
  const { ipKey, subnetKey } = networkKeys(ip)
  const db = getDb()
  const now = Date.now()
  db.prepare('DELETE FROM signup_log WHERE created_at < ?').run(now - DAY_MS)
  db.prepare('INSERT INTO signup_log (ip_key, subnet_key, created_at) VALUES (?, ?, ?)').run(ipKey, subnetKey, now)
}

function recentFailures(ip) {
  const entry = getState().failures.get(ip)
  if (!entry || Date.now() - entry.at > FAILURE_WINDOW_MS) return 0
  return entry.count
}

export function recordLoginFailure(ip) {
  const state = getState()
  state.failures.set(ip, { count: recentFailures(ip) + 1, at: Date.now() })
  if (state.failures.size > 5000) state.failures.delete(state.failures.keys().next().value)
}

export function clearLoginFailures(ip) {
  getState().failures.delete(ip)
}

function difficultyFor(mode, ip) {
  if (mode === 'register') {
    return Math.min(REGISTER_MAX_BITS, REGISTER_BASE_BITS + recentSignups(ip).bySubnet)
  }
  return Math.min(LOGIN_MAX_BITS, LOGIN_BASE_BITS + LOGIN_BITS_PER_FAILURE * recentFailures(ip))
}

export function createCaptcha(mode, ip) {
  if (!MODES.has(mode)) return null
  const salt = randomBytes(12).toString('base64url')
  const bits = difficultyFor(mode, ip)
  const payload = Buffer.from(
    JSON.stringify({
      id: randomBytes(12).toString('base64url'),
      mode,
      exp: Date.now() + CHALLENGE_TTL_MS,
      salt,
      bits,
      net: sign(`bind:${ip}`).slice(0, 16),
    }),
  ).toString('base64url')

  return { token: `${payload}.${sign(payload)}`, salt, bits }
}

function leadingZeroBits(buffer) {
  let bits = 0
  for (const byte of buffer) {
    if (byte === 0) {
      bits += 8
      continue
    }
    return bits + Math.clz32(byte) - 24
  }
  return bits
}

export function verifyCaptcha(captcha, mode, ip) {
  const token = typeof captcha?.token === 'string' ? captcha.token : ''
  const [payload, signature] = token.split('.')
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return false

  let data
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return false
  }

  const now = Date.now()
  const state = getState()
  for (const [id, exp] of state.used) {
    if (exp < now) state.used.delete(id)
  }
  if (data.mode !== mode || data.exp < now || state.used.has(data.id)) return false
  if (!safeEqual(data.net, sign(`bind:${ip}`).slice(0, 16))) return false
  if (data.bits < difficultyFor(mode, ip)) return false
  state.used.set(data.id, data.exp)

  const counter = String(captcha.counter ?? '')
  if (!/^\d{1,12}$/.test(counter)) return false
  const digest = createHash('sha256').update(`${data.salt}:${counter}`).digest()
  return leadingZeroBits(digest) >= data.bits
}
