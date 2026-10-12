import { getDb, getMeta, setMeta } from './db'

const MODRINTH_API = 'https://api.modrinth.com/v2'
const REQUEST_HEADERS = { 'User-Agent': 'ModrinthProxyExample/1.0' }
const DAY_MS = 24 * 60 * 60 * 1000
const EXACT_WINDOW_MS = 30 * 60 * 1000
const MAX_FILL_GAP_MS = 7 * DAY_MS
const SAMPLE_MIN_INTERVAL_MS = 10 * 60 * 1000
const COLLECT_INTERVAL_MS = 6 * 60 * 60 * 1000
const TOP_REFRESH_MS = DAY_MS
const FETCH_TIMEOUT_MS = 30 * 1000
const CHUNK_SIZE = 100
const CHUNK_PAUSE_MS = 200
const HISTORY_DAYS = 180
const PROJECT_ID_RE = /^[A-Za-z0-9]{6,12}$/

const TOP_LIMIT = Math.max(0, parseInt(process.env.DOWNLOAD_TREND_TOP || '10000', 10) || 0)

function getRuntime() {
  if (!globalThis.__downloadTrendRuntime) {
    globalThis.__downloadTrendRuntime = { collecting: false, scheduled: false }
  }
  return globalThis.__downloadTrendRuntime
}

function dayStart(ms) {
  return Math.floor(ms / DAY_MS) * DAY_MS
}

function dateKey(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function applySample(db, id, downloads, follows, now) {
  const prev = db.prepare('SELECT t, downloads, follows FROM trend_last WHERE project_id = ?').get(id)
  const insertPoint = db.prepare(
    'INSERT OR REPLACE INTO trend_points (project_id, kind, t, downloads, follows, est) VALUES (?, ?, ?, ?, ?, ?)',
  )
  const span = prev ? now - prev.t : 0

  if (!prev || downloads < prev.downloads || span > MAX_FILL_GAP_MS) {
    insertPoint.run(id, 'S', now, downloads, follows, 0)
  } else {
    const firstBoundary = dayStart(prev.t) + DAY_MS
    if (firstBoundary > now && span < SAMPLE_MIN_INTERVAL_MS) return
    for (let boundary = firstBoundary; boundary <= now; boundary += DAY_MS) {
      const k = span > 0 ? (boundary - prev.t) / span : 1
      const estimated = Math.min(boundary - prev.t, now - boundary) > EXACT_WINDOW_MS ? 1 : 0
      insertPoint.run(
        id,
        'D',
        boundary,
        Math.round(prev.downloads + (downloads - prev.downloads) * k),
        Math.round(prev.follows + (follows - prev.follows) * k),
        estimated,
      )
    }
  }

  db.prepare(
    `INSERT INTO trend_last (project_id, t, downloads, follows) VALUES (?, ?, ?, ?)
     ON CONFLICT(project_id) DO UPDATE SET t = excluded.t, downloads = excluded.downloads, follows = excluded.follows`,
  ).run(id, now, downloads, follows)
}

function buildTrend(points, live, now) {
  if (points.length === 0) return null

  const boundaries = new Map()
  const starts = []
  for (const point of points) {
    if (point.kind === 'D') boundaries.set(point.t, point)
    else starts.push(point)
  }

  const today = dayStart(now)
  const days = []
  let since = starts.length ? starts[0].t : null

  for (let start = today - HISTORY_DAYS * DAY_MS; start <= today; start += DAY_MS) {
    const isToday = start === today
    const from = boundaries.get(start)
    const to = isToday ? { downloads: live.downloads, follows: live.follows, est: 0 } : boundaries.get(start + DAY_MS)
    const restart = starts.filter((point) => point.t > start && point.t < start + DAY_MS).pop()
    const base = restart || from

    let value = null
    let follows = null
    if (base && to) {
      value = Math.max(0, to.downloads - base.downloads)
      follows = to.follows - base.follows
    }

    if (value !== null && since === null) since = start
    days.push({
      date: dateKey(start),
      value,
      follows,
      est: Boolean(value !== null && ((from?.est && !restart) || to?.est)),
      partial: Boolean(value !== null && (restart || isToday)),
    })
  }

  const firstKnown = days.findIndex((day) => day.value !== null)
  if (firstKnown === -1) return null

  return {
    days: days.slice(Math.max(0, Math.min(firstKnown, days.length - 8))),
    since: since ?? today,
    now,
    total: live.downloads,
  }
}

export function sampleAndGetDownloadTrend(project, now = Date.now()) {
  const id = project?.id
  const downloads = toCount(project?.downloads)
  if (!id || !PROJECT_ID_RE.test(id) || downloads === null) return null
  const follows = toCount(project.followers ?? project.follows) ?? 0

  const db = getDb()
  db.transaction(() => applySample(db, id, downloads, follows, now))()

  const last = db.prepare('SELECT downloads FROM trend_last WHERE project_id = ?').get(id)
  const points = db
    .prepare(
      'SELECT kind, t, downloads, follows, est FROM trend_points WHERE project_id = ? AND t >= ? ORDER BY t',
    )
    .all(id, dayStart(now) - (HISTORY_DAYS + 1) * DAY_MS)

  return buildTrend(points, { downloads: Math.max(downloads, last?.downloads ?? 0), follows }, now)
}

async function fetchJson(url) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: REQUEST_HEADERS,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        cache: 'no-store',
      })
      if (response.ok) return await response.json()
      if (response.status === 429) await sleep(15000)
    } catch {}
    await sleep(1500 * (attempt + 1))
  }
  return null
}

function readTopProjects() {
  try {
    const ids = JSON.parse(getMeta('trend_top') || '[]')
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

async function refreshTopProjects() {
  const ids = []
  for (let offset = 0; offset < TOP_LIMIT; offset += CHUNK_SIZE) {
    const page = await fetchJson(
      `${MODRINTH_API}/search?limit=${CHUNK_SIZE}&index=downloads&offset=${offset}`,
    )
    const hits = page?.hits
    if (!Array.isArray(hits) || hits.length === 0) break
    for (const hit of hits) {
      if (hit?.project_id && PROJECT_ID_RE.test(hit.project_id)) ids.push(hit.project_id)
    }
    await sleep(CHUNK_PAUSE_MS)
  }
  if (ids.length === 0) return
  setMeta('trend_top', JSON.stringify(ids))
  setMeta('trend_top_at', Date.now())
}

export async function collectDownloadTrends() {
  const runtime = getRuntime()
  if (runtime.collecting) return { skipped: true }
  runtime.collecting = true

  try {
    const db = getDb()
    if (TOP_LIMIT > 0 && readTopProjects().length === 0) await refreshTopProjects()

    const tracked = db.prepare('SELECT project_id FROM trend_last').all().map((row) => row.project_id)
    const ids = [...new Set([...readTopProjects(), ...tracked])]
    let sampled = 0

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE)
      const projects = await fetchJson(
        `${MODRINTH_API}/projects?ids=${encodeURIComponent(JSON.stringify(chunk))}`,
      )
      if (Array.isArray(projects)) {
        const now = Date.now()
        db.transaction(() => {
          for (const project of projects) {
            const downloads = toCount(project?.downloads)
            if (!project?.id || !PROJECT_ID_RE.test(project.id) || downloads === null) continue
            applySample(db, project.id, downloads, toCount(project.followers) ?? 0, now)
            sampled += 1
          }
        })()
      }
      await sleep(CHUNK_PAUSE_MS)
    }

    setMeta('trend_collected_at', Date.now())
    if (TOP_LIMIT > 0 && Date.now() - Number(getMeta('trend_top_at') || 0) > TOP_REFRESH_MS) {
      await refreshTopProjects()
    }
    return { tracked: ids.length, sampled }
  } finally {
    runtime.collecting = false
  }
}

function collectorEnabled() {
  const flag = process.env.DOWNLOAD_TREND_COLLECT
  if (flag === '0') return false
  if (flag === '1') return true
  return process.env.NODE_ENV === 'production'
}

export function startDownloadTrendCollector() {
  const runtime = getRuntime()
  if (runtime.scheduled || !collectorEnabled()) return
  runtime.scheduled = true

  const run = () => {
    collectDownloadTrends().catch((error) => {
      console.error('Download trend collect failed:', error)
    })
  }

  const scheduleNext = () => {
    const now = Date.now()
    const next = Math.floor(now / COLLECT_INTERVAL_MS) * COLLECT_INTERVAL_MS + COLLECT_INTERVAL_MS + 2000
    const timer = setTimeout(() => {
      run()
      scheduleNext()
    }, next - now)
    timer.unref?.()
  }

  if (Date.now() - Number(getMeta('trend_collected_at') || 0) > COLLECT_INTERVAL_MS) {
    const timer = setTimeout(run, 15000)
    timer.unref?.()
  }
  scheduleNext()
}
