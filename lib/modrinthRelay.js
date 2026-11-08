const MODRINTH_ORIGIN = 'https://api.modrinth.com'
const RELAY_TIMEOUT_MS = 10_000
const PAUSE_MS = 60_000
const MAX_PAUSE_MS = 10 * 60_000

const pauses = (globalThis.__modrinthRelayPauses ??= new Map())

function relayList() {
  return (process.env.MODRINTH_RELAYS || '')
    .split(',')
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter((entry) => /^https:\/\/[^/?#]+$/.test(entry))
}

function relayKey() {
  const key = process.env.MODRINTH_RELAY_KEY || ''
  return key.length >= 32 ? key : ''
}

export function modrinthRelaysEnabled() {
  return Boolean(relayKey()) && relayList().length > 0
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

function relayPath(url) {
  try {
    const parsed = new URL(url)
    return parsed.origin === MODRINTH_ORIGIN ? parsed.pathname + parsed.search : null
  } catch {
    return null
  }
}

export async function fetchViaRelay(url, userAgent) {
  const key = relayKey()
  const path = relayPath(url)
  if (!key || !path) return null

  for (const relay of relayList()) {
    if (paused(relay, Date.now())) continue
    try {
      const response = await fetch(`${relay}/api/relay?path=${encodeURIComponent(path)}`, {
        headers: { 'x-relay-key': key, 'User-Agent': userAgent },
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(RELAY_TIMEOUT_MS),
      })
      if (response.ok) {
        pauses.delete(relay)
        return await response.json()
      }
      if (response.status === 404 || response.status === 410) return null
      pause(relay, Date.now())
      console.warn('Modrinth relay refused:', relay, response.status)
    } catch (error) {
      pause(relay, Date.now())
      console.warn('Modrinth relay unavailable:', relay, error?.message)
    }
  }
  return null
}
