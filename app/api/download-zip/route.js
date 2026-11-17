import { zipSync } from 'fflate'
import { isSameOrigin } from '@/lib/auth'
import { MODRINTH_CDN_HOST, MODRINTH_USER_AGENT } from '@/lib/modrinth'
import { sanitizeZipFilename } from '@/lib/downloadZip'
import { countDownload } from '@/lib/downloadCounter'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const ALLOWED_HOST = MODRINTH_CDN_HOST
const RATE_LIMIT = { limit: 6, windowMs: 60_000 }
const MAX_FILES = 100
const MAX_TOTAL_BYTES = 300 * 1024 * 1024
const MAX_PARALLEL_ZIPS = 2
const FETCH_TIMEOUT_MS = 60_000

const busy = (globalThis.__downloadZipBusy ??= { count: 0, ips: new Set() })

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === ALLOWED_HOST
  } catch {
    return false
  }
}

function entryName(filename, used) {
  const base = String(filename).split(/[\\/]/).pop() || ''
  let safe = base.replace(/[<>:"|?*\x00-\x1f]/g, '_').replace(/^\.+/, '').slice(0, 180) || 'file'
  if (used.has(safe.toLowerCase())) {
    const dot = safe.lastIndexOf('.')
    const stem = dot > 0 ? safe.slice(0, dot) : safe
    const ext = dot > 0 ? safe.slice(dot) : ''
    let n = 2
    while (used.has(`${stem} (${n})${ext}`.toLowerCase())) n += 1
    safe = `${stem} (${n})${ext}`
  }
  used.add(safe.toLowerCase())
  return safe
}

async function readLimited(response, budget) {
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > budget) return null
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > budget) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  const out = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const ip = getClientIp(request)
  if (!checkRateLimit(`download-zip:${ip}`, RATE_LIMIT).ok) {
    return Response.json({ error: 'rate_limit' }, { status: 429, headers: { 'Retry-After': '60' } })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }

  const { files, zipName } = body || {}
  if (!Array.isArray(files) || files.length === 0) {
    return Response.json({ error: 'files required' }, { status: 400 })
  }

  const unique = []
  const seenUrls = new Set()
  for (const file of files) {
    if (typeof file?.url !== 'string' || typeof file?.filename !== 'string' || !isAllowedUrl(file.url)) {
      return Response.json({ error: 'invalid file url' }, { status: 400 })
    }
    if (seenUrls.has(file.url)) continue
    seenUrls.add(file.url)
    unique.push(file)
  }
  if (unique.length > MAX_FILES) {
    return Response.json({ error: 'too_many_files' }, { status: 413 })
  }

  if (busy.ips.has(ip) || busy.count >= MAX_PARALLEL_ZIPS) {
    return Response.json({ error: 'busy' }, { status: 503, headers: { 'Retry-After': '10' } })
  }
  busy.count += 1
  busy.ips.add(ip)

  try {
    const entries = {}
    const usedNames = new Set()
    let total = 0
    for (const file of unique) {
      const response = await fetch(file.url, {
        headers: { 'User-Agent': MODRINTH_USER_AGENT },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (!response.ok || !response.body) {
        return Response.json({ error: 'fetch failed' }, { status: 502 })
      }
      const data = await readLimited(response, MAX_TOTAL_BYTES - total)
      if (!data) return Response.json({ error: 'too_large' }, { status: 413 })
      total += data.byteLength
      entries[entryName(file.filename, usedNames)] = [data, { level: 0 }]
    }

    const zipped = zipSync(entries)
    for (const file of unique) countDownload(file.url, ip)
    const safeName = sanitizeZipFilename(zipName)

    return new Response(zipped, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}"`,
      },
    })
  } catch {
    return Response.json({ error: 'zip failed' }, { status: 502 })
  } finally {
    busy.count -= 1
    busy.ips.delete(ip)
  }
}
