const MINUTE_MS = 60 * 1000
const WINDOW_MINUTES = 60

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
    bucket = { requests: 0, limited: 0, minRemaining: null, kinds: {} }
    buckets.set(minute, bucket)
    for (const key of buckets.keys()) {
      if (key <= minute - WINDOW_MINUTES) buckets.delete(key)
    }
  }
  return bucket
}

export function noteModrinthRequest(url) {
  const bucket = bucketFor(Date.now())
  bucket.requests += 1
  const kind = kindOf(url)
  bucket.kinds[kind] = (bucket.kinds[kind] || 0) + 1
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
  const kinds = {}
  for (let minute = current - WINDOW_MINUTES + 1; minute <= current; minute++) {
    const bucket = buckets.get(minute)
    minutes.push({
      at: minute * MINUTE_MS,
      requests: bucket?.requests || 0,
      limited: bucket?.limited || 0,
      minRemaining: bucket?.minRemaining ?? null,
    })
    for (const [kind, n] of Object.entries(bucket?.kinds || {})) kinds[kind] = (kinds[kind] || 0) + n
  }
  const byKind = Object.entries(kinds)
    .map(([kind, n]) => ({ kind, n }))
    .sort((a, b) => b.n - a.n)
  return { limit: 300, minutes, byKind }
}

export function watchModrinthTraffic() {
  if (globalThis.__modrinthTrafficWatch) return
  globalThis.__modrinthTrafficWatch = true
  const realFetch = globalThis.fetch
  globalThis.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || String(input)
    if (!url.includes('api.modrinth.com')) return realFetch(input, init)
    noteModrinthRequest(url)
    return realFetch(input, init).then((response) => {
      noteModrinthResponse(response)
      return response
    })
  }
}
