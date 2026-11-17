import { Zip, ZipPassThrough } from 'fflate'
import { isSameOrigin } from '@/lib/auth'
import { MODRINTH_CDN_HOST, MODRINTH_USER_AGENT } from '@/lib/modrinth'
import { sanitizeZipFilename } from '@/lib/downloadZip'
import { countDownload } from '@/lib/downloadCounter'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 6, windowMs: 60_000 }
const MAX_FILES = 100
const MAX_TOTAL_BYTES = 300 * 1024 * 1024
const MAX_PARALLEL_ZIPS = 4
const DEADLINE_MS = 5 * 60 * 1000
const QUEUE_BYTES = 4 * 1024 * 1024

const busy = (globalThis.__downloadZipBusy ??= { count: 0, ips: new Set() })

function normalizeUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.hostname !== MODRINTH_CDN_HOST || parsed.username || parsed.password) return null
    if (parsed.port && parsed.port !== '443') return null
    return `https://${MODRINTH_CDN_HOST}${parsed.pathname}`
  } catch {
    return null
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

function contentDisposition(name) {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
    const url = typeof file?.url === 'string' ? normalizeUrl(file.url) : null
    if (!url || typeof file?.filename !== 'string') {
      return Response.json({ error: 'invalid file url' }, { status: 400 })
    }
    if (seenUrls.has(url)) continue
    seenUrls.add(url)
    unique.push({ url, filename: file.filename })
  }
  if (unique.length > MAX_FILES) {
    return Response.json({ error: 'too_many_files' }, { status: 413 })
  }

  if (busy.ips.has(ip) || busy.count >= MAX_PARALLEL_ZIPS) {
    return Response.json({ error: 'busy' }, { status: 503, headers: { 'Retry-After': '10' } })
  }
  busy.count += 1
  busy.ips.add(ip)
  let released = false
  const release = () => {
    if (released) return
    released = true
    busy.count -= 1
    busy.ips.delete(ip)
  }

  const abort = new AbortController()
  const signal = AbortSignal.any([abort.signal, request.signal, AbortSignal.timeout(DEADLINE_MS)])

  const stream = new ReadableStream(
    {
      async start(controller) {
        let failed = false
        const fail = (error) => {
          if (failed) return
          failed = true
          abort.abort()
          try {
            controller.error(error)
          } catch {}
        }
        const zip = new Zip((error, chunk, final) => {
          if (error) return fail(error)
          if (failed) return
          controller.enqueue(chunk)
          if (final) controller.close()
        })
        const waitForReader = async () => {
          while (!failed && controller.desiredSize !== null && controller.desiredSize <= 0) {
            if (signal.aborted) throw new Error('aborted')
            await sleep(25)
          }
        }

        try {
          const usedNames = new Set()
          let total = 0
          for (const file of unique) {
            if (signal.aborted) throw new Error('aborted')
            const response = await fetch(file.url, {
              headers: { 'User-Agent': MODRINTH_USER_AGENT },
              signal,
              cache: 'no-store',
            })
            if (!response.ok || !response.body) throw new Error('fetch failed')
            const declared = Number(response.headers.get('content-length') || 0)
            if (total + declared > MAX_TOTAL_BYTES) throw new Error('too large')

            const entry = new ZipPassThrough(entryName(file.filename, usedNames))
            zip.add(entry)
            const reader = response.body.getReader()
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              total += value.byteLength
              if (total > MAX_TOTAL_BYTES) {
                await reader.cancel().catch(() => {})
                throw new Error('too large')
              }
              entry.push(value)
              await waitForReader()
            }
            entry.push(new Uint8Array(0), true)
          }
          zip.end()
          for (const file of unique) countDownload(file.url, ip)
        } catch (error) {
          fail(error)
        } finally {
          release()
        }
      },
      cancel() {
        abort.abort()
        release()
      },
    },
    new ByteLengthQueuingStrategy({ highWaterMark: QUEUE_BYTES }),
  )

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': contentDisposition(sanitizeZipFilename(zipName)),
      'Cache-Control': 'no-store',
    },
  })
}
