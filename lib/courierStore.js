import { cookies } from 'next/headers'

export const COURIER_COOKIE = 'mp_courier'
export const COURIER_TTL_MS = 2 * 60 * 1000
const MAX_ENTRIES = 300

const store = (globalThis.__courierStore ??= new Map())

function courierKey(token, url) {
  try {
    const parsed = new URL(url)
    return `${token} ${parsed.origin}${parsed.pathname.toLowerCase()}`
  } catch {
    return `${token} ${String(url).toLowerCase()}`
  }
}

function prune(now) {
  for (const [key, entry] of store) {
    if (entry.expires <= now) store.delete(key)
  }
}

export function putCourier(token, url, data) {
  const now = Date.now()
  prune(now)
  while (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value)
  store.set(courierKey(token, url), { data, expires: now + COURIER_TTL_MS })
}

export function readCourier(url) {
  let token
  try {
    token = cookies().get(COURIER_COOKIE)?.value
  } catch {
    return null
  }
  if (!token) return null
  const entry = store.get(courierKey(token, url))
  if (!entry || entry.expires <= Date.now()) return null
  return entry.data
}

globalThis.__courierLookup = readCourier
