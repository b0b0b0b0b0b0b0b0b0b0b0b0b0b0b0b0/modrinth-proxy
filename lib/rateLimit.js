const buckets = new Map()

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(now) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (now - bucket.start >= bucket.windowMs) {
      buckets.delete(key)
    }
  }
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function checkRateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now()
  cleanup(now)

  let bucket = buckets.get(key)
  if (!bucket || now - bucket.start >= windowMs) {
    bucket = { start: now, count: 0, windowMs }
    buckets.set(key, bucket)
  }

  bucket.count += 1

  const resetMs = Math.max(0, windowMs - (now - bucket.start))
  const remaining = Math.max(0, limit - bucket.count)

  return {
    ok: bucket.count <= limit,
    remaining,
    resetMs,
    limit,
  }
}
