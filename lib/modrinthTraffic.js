const MINUTE_MS = 60 * 1000
const WINDOW_MINUTES = 60

const buckets = (globalThis.__modrinthTraffic ??= new Map())

function bucketFor(now) {
  const minute = Math.floor(now / MINUTE_MS)
  let bucket = buckets.get(minute)
  if (!bucket) {
    bucket = { requests: 0, limited: 0, minRemaining: null }
    buckets.set(minute, bucket)
    for (const key of buckets.keys()) {
      if (key <= minute - WINDOW_MINUTES) buckets.delete(key)
    }
  }
  return bucket
}

export function noteModrinthRequest() {
  bucketFor(Date.now()).requests += 1
}

export function noteModrinthResponse(response) {
  const bucket = bucketFor(Date.now())
  if (response.status === 429) bucket.limited += 1
  const remaining = Number(response.headers.get('x-ratelimit-remaining'))
  if (Number.isFinite(remaining) && (bucket.minRemaining === null || remaining < bucket.minRemaining)) {
    bucket.minRemaining = remaining
  }
}

export function getModrinthTraffic(now = Date.now()) {
  const current = Math.floor(now / MINUTE_MS)
  const minutes = []
  for (let minute = current - WINDOW_MINUTES + 1; minute <= current; minute++) {
    const bucket = buckets.get(minute)
    minutes.push({
      at: minute * MINUTE_MS,
      requests: bucket?.requests || 0,
      limited: bucket?.limited || 0,
      minRemaining: bucket?.minRemaining ?? null,
    })
  }
  return { limit: 300, minutes }
}

export function watchModrinthTraffic() {
  if (globalThis.__modrinthTrafficWatch) return
  globalThis.__modrinthTrafficWatch = true
  const realFetch = globalThis.fetch
  globalThis.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || String(input)
    if (!url.includes('api.modrinth.com')) return realFetch(input, init)
    noteModrinthRequest()
    return realFetch(input, init).then((response) => {
      noteModrinthResponse(response)
      return response
    })
  }
}
