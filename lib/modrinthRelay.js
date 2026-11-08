import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import path from 'path'

const MODRINTH_ORIGIN = 'https://api.modrinth.com'
const RELAY_TIMEOUT_MS = 10_000
const PAUSE_MS = 60_000
const MAX_PAUSE_MS = 10 * 60_000
const MINUTE_MS = 60_000
const DEFAULT_DAILY_LIMIT = 20_000
const DEFAULT_MINUTE_LIMIT = 30
const SAVE_EVERY_MS = 30_000
const USAGE_FILE = path.join(process.cwd(), 'data', 'relay-usage.json')

const pauses = (globalThis.__modrinthRelayPauses ??= new Map())
const usage = (globalThis.__modrinthRelayUsage ??= loadUsage())

function limitValue(raw, fallback) {
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback
}

function relayList() {
  const daily = limitValue(process.env.MODRINTH_RELAY_DAILY, DEFAULT_DAILY_LIMIT)
  const perMinute = limitValue(process.env.MODRINTH_RELAY_PER_MINUTE, DEFAULT_MINUTE_LIMIT)
  return (process.env.MODRINTH_RELAYS || '')
    .split(',')
    .map((entry) => {
      const [origin, dayLimit, minuteLimit] = entry.trim().split('|').map((part) => part.trim())
      return {
        origin: (origin || '').replace(/\/+$/, ''),
        daily: limitValue(dayLimit, daily),
        perMinute: limitValue(minuteLimit, perMinute),
      }
    })
    .filter((relay) => /^https:\/\/[^/?#|]+$/.test(relay.origin))
}

function relayKey() {
  const key = process.env.MODRINTH_RELAY_KEY || ''
  return key.length >= 32 ? key : ''
}

function today(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10)
}

function loadUsage() {
  const fresh = { day: today(), used: {}, minute: 0, minuteUsed: {}, dirty: false, savedAt: 0 }
  try {
    const saved = JSON.parse(readFileSync(USAGE_FILE, 'utf8'))
    if (saved?.day === fresh.day && saved.used && typeof saved.used === 'object') {
      for (const [origin, n] of Object.entries(saved.used)) {
        if (Number.isFinite(n)) fresh.used[origin] = n
      }
    }
  } catch {}
  return fresh
}

function saveUsage(now) {
  if (!usage.dirty || now - usage.savedAt < SAVE_EVERY_MS) return
  usage.savedAt = now
  usage.dirty = false
  try {
    mkdirSync(path.dirname(USAGE_FILE), { recursive: true })
    const temp = `${USAGE_FILE}.tmp`
    writeFileSync(temp, JSON.stringify({ day: usage.day, used: usage.used }))
    renameSync(temp, USAGE_FILE)
  } catch {}
}

function rollUsage(now) {
  const day = today(now)
  if (usage.day !== day) {
    usage.day = day
    usage.used = {}
    usage.dirty = true
  }
  const minute = Math.floor(now / MINUTE_MS)
  if (usage.minute !== minute) {
    usage.minute = minute
    usage.minuteUsed = {}
  }
}

function takeQuota(relay, now) {
  rollUsage(now)
  const used = usage.used[relay.origin] || 0
  const minuteUsed = usage.minuteUsed[relay.origin] || 0
  if (used >= relay.daily || minuteUsed >= relay.perMinute) return false
  usage.used[relay.origin] = used + 1
  usage.minuteUsed[relay.origin] = minuteUsed + 1
  usage.dirty = true
  saveUsage(now)
  return true
}

export function modrinthRelayCount() {
  return relayKey() ? relayList().length : 0
}

export function modrinthRelayUsage(now = Date.now()) {
  rollUsage(now)
  const relays = relayKey() ? relayList() : []
  return {
    day: usage.day,
    relays: relays.map((relay) => ({
      name: relayName(relay.origin),
      used: usage.used[relay.origin] || 0,
      dailyLimit: relay.daily,
      minuteLimit: relay.perMinute,
    })),
    used: relays.reduce((sum, relay) => sum + (usage.used[relay.origin] || 0), 0),
    dailyLimit: relays.reduce((sum, relay) => sum + relay.daily, 0),
    minuteLimit: relays.reduce((sum, relay) => sum + relay.perMinute, 0),
  }
}

function relayName(origin) {
  const host = origin.slice('https://'.length)
  if (host.endsWith('.workers.dev')) return 'Cloudflare'
  if (host.endsWith('.vercel.app')) return 'Vercel'
  return host
}

function note(event, relay) {
  try {
    globalThis.__noteModrinthRelay?.(event, relay ? relayName(relay.origin) : undefined)
  } catch {}
}

function paused(relay, now) {
  const pause = pauses.get(relay)
  return Boolean(pause && pause.until > now)
}

function pause(relay, now) {
  const previous = pauses.get(relay)
  const ms = previous && previous.until > now - MAX_PAUSE_MS ? Math.min(previous.ms * 2, MAX_PAUSE_MS) : PAUSE_MS
  pauses.set(relay, { ms, until: now + ms })
}

const SKIPPED_SUFFIX = '/disclosures'

function relayPath(url) {
  try {
    const parsed = new URL(url)
    if (parsed.origin !== MODRINTH_ORIGIN || parsed.pathname.endsWith(SKIPPED_SUFFIX)) return null
    return parsed.pathname + parsed.search
  } catch {
    return null
  }
}

function relayed(body, status) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'application/json', 'x-modrinth-route': 'relay' },
  })
}

export async function relayModrinthResponse(url, userAgent) {
  const key = relayKey()
  const target = relayPath(url)
  if (!key || !target) return null

  for (const relay of relayList()) {
    const now = Date.now()
    if (paused(relay.origin, now)) continue
    if (!takeQuota(relay, now)) {
      note('capped', relay)
      continue
    }
    try {
      const response = await fetch(`${relay.origin}/api/relay?path=${encodeURIComponent(target)}`, {
        headers: { 'x-relay-key': key, 'User-Agent': userAgent },
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(RELAY_TIMEOUT_MS),
      })
      if (response.ok || response.status === 404 || response.status === 410) {
        const body = await response.text()
        pauses.delete(relay.origin)
        note('served', relay)
        return relayed(body, response.status)
      }
      pause(relay.origin, Date.now())
      note('refused', relay)
      console.warn('Modrinth relay refused:', relay.origin, response.status)
    } catch (error) {
      pause(relay.origin, Date.now())
      note('failed', relay)
      console.warn('Modrinth relay unavailable:', relay.origin, error?.message)
    }
  }
  return null
}
