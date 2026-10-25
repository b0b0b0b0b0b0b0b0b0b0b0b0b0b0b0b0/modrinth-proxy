import { cookies, headers } from 'next/headers'

export const COURIER_COOKIE = 'mp_courier'
export const COURIER_TTL_MS = 2 * 60 * 1000
const MAX_TOTAL_BYTES = 64 * 1024 * 1024
const PAGE_PATH_RE = /^\/(?:mod|plugin|datapack|resourcepack|shader|modpack|project)\/([^/?#]+)/

const store = (globalThis.__courierStore ??= new Map())

function urlKey(url) {
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname.toLowerCase()}`
  } catch {
    return String(url).toLowerCase()
  }
}

function totalBytes() {
  let sum = 0
  for (const delivery of store.values()) sum += delivery.bytes
  return sum
}

function prune(now) {
  for (const [token, delivery] of store) {
    if (delivery.expires <= now) store.delete(token)
  }
}

function pageSlug() {
  try {
    const match = PAGE_PATH_RE.exec(headers().get('x-modrinth-pathname') || '')
    return match ? decodeURIComponent(match[1]).toLowerCase() : null
  } catch {
    return null
  }
}

export function putCourierDelivery(token, slug, items) {
  const now = Date.now()
  prune(now)
  store.delete(token)

  const entries = new Map()
  let bytes = 0
  for (const { url, data, size } of items) {
    entries.set(urlKey(url), data)
    bytes += size
  }
  if (bytes > MAX_TOTAL_BYTES) return false

  while (store.size > 0 && totalBytes() + bytes > MAX_TOTAL_BYTES) {
    store.delete(store.keys().next().value)
  }
  store.set(token, { slug: slug.toLowerCase(), entries, bytes, expires: now + COURIER_TTL_MS })
  return true
}

export function readCourier(url) {
  let token
  try {
    token = cookies().get(COURIER_COOKIE)?.value
  } catch {
    return null
  }
  if (!token) return null
  const delivery = store.get(token)
  if (!delivery || delivery.expires <= Date.now()) return null
  if (pageSlug() !== delivery.slug) return null
  return delivery.entries.get(urlKey(url)) ?? null
}

globalThis.__courierLookup = readCourier
