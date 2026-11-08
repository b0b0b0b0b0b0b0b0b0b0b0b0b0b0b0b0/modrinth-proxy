import { createHash } from 'crypto'
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external'
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external'
import { getClientIp } from './rateLimit'
import { SESSION_COOKIE } from './auth'
import { createModrinthRouter } from './modrinthRouter'
import { modrinthRelayCount, modrinthRelayUsage } from './modrinthRelay'

const MINUTE_MS = 60 * 1000
const WINDOW_MINUTES = 60
const MAX_SOURCES_PER_MINUTE = 400
const MAX_PATHS_PER_SOURCE = 30
export const TRAFFIC_IPS = false

const MIRROR_EVENTS = ['served', 'cached', 'missed', 'failed', 'switched']
const RELAY_EVENTS = ['served', 'refused', 'failed', 'capped']
const OVERFLOW_KEY = '…'
const BACKGROUND_KEY = 'server'
const LOOPBACK_RE = /^(?:127\.|::ffff:127\.|::1$)/

const buckets = (globalThis.__modrinthTraffic ??= new Map())

const KIND_RULES = [
  [/^\/v[23]\/search/, 'search'],
  [/^\/v2\/version_files\/update/, 'updates-bulk'],
  [/^\/v2\/version_file/, 'file-hash'],
  [/^\/v2\/versions/, 'versions-bulk'],
  [/^\/v2\/projects/, 'projects-bulk'],
  [/^\/v[23]\/project\/[^/]+\/version/, 'project-versions'],
  [/^\/v[23]\/project\/[^/]+\/(members|team)/, 'project-members'],
  [/^\/v[23]\/project\/[^/]+\/dependencies/, 'project-dependencies'],
  [/^\/v[23]\/project\/[^/]+\/disclosures/, 'project-disclosures'],
  [/^\/v[23]\/project\/[^/]+\/?$/, 'project'],
  [/^\/v[23]\/version\//, 'version'],
  [/^\/v[23]\/user\/[^/]+\/projects/, 'user-projects'],
  [/^\/v[23]\/user/, 'user'],
  [/^\/v[23]\/organization/, 'organization'],
  [/^\/v[23]\/team/, 'team'],
  [/^\/v[23]\/collection/, 'collection'],
  [/^\/v[23]\/tag/, 'tag'],
  [/^\/v[23]\/statistics/, 'statistics'],
]

function kindOf(url) {
  let path = ''
  try {
    path = new URL(url).pathname
  } catch {
    return 'other'
  }
  for (const [re, kind] of KIND_RULES) if (re.test(path)) return kind
  return 'other'
}

function bucketFor(now) {
  const minute = Math.floor(now / MINUTE_MS)
  let bucket = buckets.get(minute)
  if (!bucket) {
    bucket = { requests: 0, limited: 0, minRemaining: null, kinds: {}, mirror: Object.fromEntries(MIRROR_EVENTS.map((event) => [event, 0])), relay: Object.fromEntries(RELAY_EVENTS.map((event) => [event, 0])), relayBy: {}, sources: new Map() }
    buckets.set(minute, bucket)
    for (const key of buckets.keys()) {
      if (key <= minute - WINDOW_MINUTES) buckets.delete(key)
    }
  }
  return bucket
}

function pagePath(store) {
  const headers = store.headers
  const fromMiddleware = headers.get('x-modrinth-pathname')
  if (fromMiddleware) return fromMiddleware
  if (store.url?.pathname) return store.url.pathname
  return headers.get('next-url') || '?'
}

function hashSession(token) {
  if (!token || token.length > 128) return null
  return createHash('sha256').update(token).digest('hex')
}

function currentSource() {
  if (!TRAFFIC_IPS) return { key: OVERFLOW_KEY, ip: OVERFLOW_KEY, ua: '', path: '', session: null, prefetch: false }
  let store = null
  try {
    store = workUnitAsyncStorage.getStore()
  } catch {}
  if (store?.type !== 'request') {
    let path = 'background'
    try {
      path = workAsyncStorage.getStore()?.route || path
    } catch {}
    return { key: BACKGROUND_KEY, ip: BACKGROUND_KEY, ua: '', path, session: null, prefetch: false }
  }
  const headers = store.headers
  const ip = getClientIp({ headers })
  const path = pagePath(store).slice(0, 200)
  if (ip === 'unknown' || (LOOPBACK_RE.test(ip) && path.startsWith('/api/internal/'))) {
    return { key: BACKGROUND_KEY, ip: BACKGROUND_KEY, ua: '', path, session: null, prefetch: false }
  }
  let session = null
  try {
    session = hashSession(store.cookies.get(SESSION_COOKIE)?.value)
  } catch {}
  return {
    key: ip,
    ip,
    ua: (headers.get('user-agent') || '').slice(0, 300),
    path,
    session,
    prefetch: headers.has('next-router-prefetch'),
  }
}

function sourceEntry(bucket, source) {
  let key = source.key
  if (!bucket.sources.has(key) && bucket.sources.size >= MAX_SOURCES_PER_MINUTE) key = OVERFLOW_KEY
  let entry = bucket.sources.get(key)
  if (!entry) {
    entry = {
      ip: key === OVERFLOW_KEY ? OVERFLOW_KEY : source.ip,
      uas: new Map(),
      sessions: new Set(),
      requests: 0,
      limited: 0,
      prefetch: 0,
      kinds: {},
      paths: new Map(),
    }
    bucket.sources.set(key, entry)
  }
  return entry
}

export function noteModrinthRequest(url, source = currentSource()) {
  const bucket = bucketFor(Date.now())
  bucket.requests += 1
  const kind = kindOf(url)
  bucket.kinds[kind] = (bucket.kinds[kind] || 0) + 1

  const entry = sourceEntry(bucket, source)
  entry.requests += 1
  entry.kinds[kind] = (entry.kinds[kind] || 0) + 1
  if (source.prefetch) entry.prefetch += 1
  if (source.ua && entry.uas.size < 5) entry.uas.set(source.ua, (entry.uas.get(source.ua) || 0) + 1)
  else if (source.ua && entry.uas.has(source.ua)) entry.uas.set(source.ua, entry.uas.get(source.ua) + 1)
  if (source.session && entry.sessions.size < 10) entry.sessions.add(source.session)
  if (entry.paths.has(source.path) || entry.paths.size < MAX_PATHS_PER_SOURCE) {
    entry.paths.set(source.path, (entry.paths.get(source.path) || 0) + 1)
  }
  return source
}

export function noteModrinthResponse(response, source) {
  const bucket = bucketFor(Date.now())
  if (response.status === 429) {
    bucket.limited += 1
    if (source) sourceEntry(bucket, source).limited += 1
  }
  const remaining = Number(response.headers.get('x-ratelimit-remaining'))
  if (Number.isFinite(remaining) && (bucket.minRemaining === null || remaining < bucket.minRemaining)) {
    bucket.minRemaining = remaining
  }
}

export function noteModrinthRoute(event) {
  const mirror = bucketFor(Date.now()).mirror
  if (MIRROR_EVENTS.includes(event)) mirror[event] = (mirror[event] || 0) + 1
}

export function noteModrinthRelay(event, name) {
  if (!RELAY_EVENTS.includes(event)) return
  const bucket = bucketFor(Date.now())
  bucket.relay[event] = (bucket.relay[event] || 0) + 1
  if (!name) return
  const own = (bucket.relayBy[name] ??= Object.fromEntries(RELAY_EVENTS.map((key) => [key, 0])))
  own[event] += 1
}

globalThis.__noteModrinthRelay = noteModrinthRelay

const modrinthRouter = (globalThis.__modrinthRouter ??= createModrinthRouter({ onEvent: noteModrinthRoute }))

export function isModrinthOnMirror() {
  return modrinthRouter.onMirror
}

function topEntries(map, limit) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}

function mergeSources(range) {
  const merged = new Map()
  for (const { minute, bucket } of range) {
    for (const [key, entry] of bucket.sources) {
      let row = merged.get(key)
      if (!row) {
        row = { ip: entry.ip, uas: new Map(), sessions: new Set(), requests: 0, limited: 0, prefetch: 0, kinds: {}, paths: new Map(), minutes: [] }
        merged.set(key, row)
      }
      row.requests += entry.requests
      row.limited += entry.limited
      row.prefetch += entry.prefetch
      row.minutes.push({ at: minute * MINUTE_MS, n: entry.requests })
      for (const [ua, n] of entry.uas) row.uas.set(ua, (row.uas.get(ua) || 0) + n)
      for (const session of entry.sessions) row.sessions.add(session)
      for (const [kind, n] of Object.entries(entry.kinds)) row.kinds[kind] = (row.kinds[kind] || 0) + n
      for (const [path, n] of entry.paths) row.paths.set(path, (row.paths.get(path) || 0) + n)
    }
  }
  return [...merged.values()]
    .sort((a, b) => b.requests - a.requests)
    .map((row) => ({
      ip: row.ip,
      uas: topEntries(row.uas, 3).map(([ua, n]) => ({ ua, n })),
      sessions: [...row.sessions],
      requests: row.requests,
      limited: row.limited,
      prefetch: row.prefetch,
      kinds: Object.entries(row.kinds)
        .map(([kind, n]) => ({ kind, n }))
        .sort((a, b) => b.n - a.n),
      paths: topEntries(row.paths, 10).map(([path, n]) => ({ path, n })),
      pathsCount: row.paths.size,
      minutes: row.minutes,
    }))
}

export function getModrinthTraffic(now = Date.now(), { from = null, to = null, sourcesLimit = 40 } = {}) {
  const current = Math.floor(now / MINUTE_MS)
  const minutes = []
  const kinds = {}
  const relayBy = {}
  const range = []
  const fromMinute = from == null ? null : Math.floor(from / MINUTE_MS)
  const toMinute = to == null ? fromMinute : Math.floor(to / MINUTE_MS)
  for (let minute = current - WINDOW_MINUTES + 1; minute <= current; minute++) {
    const bucket = buckets.get(minute)
    const minuteKinds = Object.entries(bucket?.kinds || {})
      .map(([kind, n]) => ({ kind, n }))
      .sort((a, b) => b.n - a.n)
    const topSource = bucket
      ? [...bucket.sources.values()].reduce((best, entry) => (!best || entry.requests > best.requests ? entry : best), null)
      : null
    minutes.push({
      at: minute * MINUTE_MS,
      requests: bucket?.requests || 0,
      limited: bucket?.limited || 0,
      mirror: Object.fromEntries(MIRROR_EVENTS.map((event) => [event, bucket?.mirror?.[event] || 0])),
      relay: Object.fromEntries(RELAY_EVENTS.map((event) => [event, bucket?.relay?.[event] || 0])),
      minRemaining: bucket?.minRemaining ?? null,
      kinds: minuteKinds,
      sources: bucket?.sources.size || 0,
      top: topSource ? { ip: topSource.ip, n: topSource.requests } : null,
    })
    for (const [kind, n] of Object.entries(bucket?.kinds || {})) kinds[kind] = (kinds[kind] || 0) + n
    for (const [name, counts] of Object.entries(bucket?.relayBy || {})) {
      const total = (relayBy[name] ??= Object.fromEntries(RELAY_EVENTS.map((key) => [key, 0])))
      for (const key of RELAY_EVENTS) total[key] += counts[key] || 0
    }
    const inRange = fromMinute == null || (minute >= fromMinute && minute <= toMinute)
    if (bucket && inRange) range.push({ minute, bucket })
  }
  const byKind = Object.entries(kinds)
    .map(([kind, n]) => ({ kind, n }))
    .sort((a, b) => b.n - a.n)
  const allSources = mergeSources(range)
  return {
    limit: 300,
    mirrorUntil: modrinthRouter.onMirror ? modrinthRouter.routeSwitch.until : null,
    relays: modrinthRelayCount(),
    relayUsage: modrinthRelayUsage(now),
    relayBy,
    minutes,
    byKind,
    range: fromMinute == null ? null : { from: fromMinute * MINUTE_MS, to: toMinute * MINUTE_MS },
    sourcesTotal: allSources.length,
    sources: allSources.slice(0, sourcesLimit),
  }
}

export function watchModrinthTraffic() {
  if (globalThis.__modrinthTrafficWatch) return
  globalThis.__modrinthTrafficWatch = true
  const realFetch = globalThis.fetch
  globalThis.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || String(input)
    if (!url.includes('api.modrinth.com')) return realFetch(input, init)
    const method = String(init?.method || input?.method || 'GET').toUpperCase()
    return modrinthRouter.fetch(url, method, () => {
      let source = null
      try {
        source = noteModrinthRequest(url)
      } catch {}
      return realFetch(input, init).then((response) => {
        try {
          noteModrinthResponse(response, source)
        } catch {}
        return response
      })
    })
  }
}
