const MODRINTH_API_ORIGIN = 'https://api.modrinth.com'
const MIRRORED_PREFIX = '/v2/'
const SERVICE_FIELDS = ['sync_at', 'checked_at']
const IGNORED_PARAMS = ['v']

class MirrorFreshness {
  constructor(maxAgeMs) {
    this.maxAgeMs = maxAgeMs
  }

  accepts(payload, now = Date.now()) {
    const dates = this.#entries(payload).map((entry) => this.#refreshedAt(entry))
    if (dates.every((date) => date === undefined)) return true
    return dates.every((date) => Number.isFinite(date) && Math.abs(now - date) <= this.maxAgeMs)
  }

  #entries(payload) {
    if (Array.isArray(payload)) return payload
    return payload && typeof payload === 'object' ? [payload] : []
  }

  #refreshedAt(entry) {
    if (!entry || typeof entry !== 'object') return undefined
    const stamps = SERVICE_FIELDS.filter((field) => entry[field] != null).map((field) => Date.parse(entry[field]))
    if (stamps.length === 0) return undefined
    return stamps.some(Number.isNaN) ? NaN : Math.max(...stamps)
  }
}

const SETTLED_PATHS = [/^\/v2\/version\/[^/]+$/, /^\/v2\/versions$/]
const PROJECT_VERSIONS_PATH = /^\/v2\/project\/[^/]+\/version$/

class MirrorTrust {
  constructor(freshness) {
    this.freshness = freshness
  }

  accepts(payload, url) {
    const parsed = new URL(url)
    if (SETTLED_PATHS.some((path) => path.test(parsed.pathname))) return true
    if (this.#completeVersionList(payload, parsed)) return true
    return this.freshness.accepts(payload)
  }

  #completeVersionList(payload, parsed) {
    if (!Array.isArray(payload) || !PROJECT_VERSIONS_PATH.test(parsed.pathname)) return false
    if ([...parsed.searchParams.keys()].some((key) => key !== 'v')) return false
    const count = Number.parseInt(parsed.searchParams.get('v') || '', 10)
    return Number.isFinite(count) && count > 0 && payload.length === count
  }
}

class MirrorPayload {
  static restore(payload) {
    if (Array.isArray(payload)) return MirrorPayload.#newestFirst(payload.map(MirrorPayload.#strip))
    return MirrorPayload.#strip(payload)
  }

  static #strip(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry
    const copy = { ...entry }
    for (const field of SERVICE_FIELDS) delete copy[field]
    return copy
  }

  static #newestFirst(entries) {
    const dated = entries.every((entry) => typeof entry?.date_published === 'string')
    if (!dated) return entries
    return [...entries].sort((a, b) => Date.parse(b.date_published) - Date.parse(a.date_published))
  }
}

class MirrorCache {
  #entries = new Map()
  #bytes = 0

  constructor({ ttlMs, maxBytes }) {
    this.ttlMs = ttlMs
    this.maxBytes = maxBytes
  }

  get(key) {
    const entry = this.#entries.get(key)
    if (!entry) return null
    if (entry.expires <= Date.now()) {
      this.#drop(key)
      return null
    }
    this.#entries.delete(key)
    this.#entries.set(key, entry)
    return entry.payload
  }

  set(key, payload, bytes) {
    this.#drop(key)
    if (bytes > this.maxBytes) return
    while (this.#entries.size > 0 && this.#bytes + bytes > this.maxBytes) {
      this.#drop(this.#entries.keys().next().value)
    }
    this.#entries.set(key, { payload, bytes, expires: Date.now() + this.ttlMs })
    this.#bytes += bytes
  }

  #drop(key) {
    const entry = this.#entries.get(key)
    if (!entry) return
    this.#bytes -= entry.bytes
    this.#entries.delete(key)
  }
}

class MirrorBreaker {
  #pausedUntil = 0
  #failures = 0

  constructor({ baseMs, maxMs }) {
    this.baseMs = baseMs
    this.maxMs = maxMs
  }

  get open() {
    return Date.now() < this.#pausedUntil
  }

  succeed() {
    this.#failures = 0
    this.#pausedUntil = 0
  }

  fail(retryAfterMs = 0) {
    this.#failures += 1
    const backoff = Math.min(this.baseMs * 2 ** (this.#failures - 1), this.maxMs)
    this.#pausedUntil = Date.now() + Math.max(backoff, Math.min(retryAfterMs, this.maxMs))
  }
}

export class ModrinthMirror {
  #inflight = new Map()

  constructor({ name, origin, prefix, enabled = true, userAgent, timeoutMs, maxAgeMs, cacheTtlMs, cacheMaxBytes, pauseMs, maxPauseMs, onResult }) {
    this.name = name
    this.origin = origin
    this.prefix = prefix
    this.enabled = enabled
    this.userAgent = userAgent
    this.timeoutMs = timeoutMs
    this.onResult = onResult
    this.trust = new MirrorTrust(new MirrorFreshness(maxAgeMs))
    this.cache = new MirrorCache({ ttlMs: cacheTtlMs, maxBytes: cacheMaxBytes })
    this.breaker = new MirrorBreaker({ baseMs: pauseMs, maxMs: maxPauseMs })
  }

  supports(url) {
    const parsed = this.#parse(url)
    return Boolean(parsed && parsed.origin === MODRINTH_API_ORIGIN && parsed.pathname.startsWith(MIRRORED_PREFIX))
  }

  mirrorUrl(url) {
    const parsed = this.#parse(url)
    for (const param of IGNORED_PARAMS) parsed.searchParams.delete(param)
    return `${this.origin}${this.prefix}${parsed.pathname}${parsed.search}`
  }

  async lookup(url) {
    if (!this.enabled || !this.supports(url)) return null
    const cached = this.cache.get(url)
    if (cached) {
      this.#note('cached')
      return cached
    }
    if (this.breaker.open) return null
    const pending = this.#inflight.get(url)
    if (pending) return pending
    const request = this.#request(url).finally(() => this.#inflight.delete(url))
    this.#inflight.set(url, request)
    return request
  }

  async #request(url) {
    const target = this.mirrorUrl(url)
    let response
    try {
      response = await fetch(target, {
        headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error) {
      this.breaker.fail()
      this.#note('failed')
      console.warn(`${this.name} mirror unreachable:`, target, error?.message)
      return null
    }

    if (response.status === 404 || response.status === 410) {
      this.breaker.succeed()
      this.#note('missed')
      return null
    }
    if (!response.ok) {
      this.breaker.fail(this.#retryAfterMs(response))
      this.#note('failed')
      console.warn(`${this.name} mirror error ${response.status}:`, target)
      return null
    }

    let text
    let payload
    try {
      text = await response.text()
      payload = JSON.parse(text)
    } catch {
      this.breaker.fail()
      this.#note('failed')
      return null
    }
    this.breaker.succeed()

    if (!this.trust.accepts(payload, url)) {
      this.#note('missed')
      console.warn(`${this.name} mirror copy is stale:`, target)
      return null
    }
    const restored = MirrorPayload.restore(payload)
    this.cache.set(url, restored, text.length)
    this.#note('served')
    return restored
  }

  #note(result) {
    try {
      this.onResult?.(result)
    } catch {}
  }

  #retryAfterMs(response) {
    const seconds = Number(response.headers.get('retry-after'))
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0
  }

  #parse(url) {
    try {
      return new URL(url)
    } catch {
      return null
    }
  }
}
