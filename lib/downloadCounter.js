import { createHash } from 'crypto'
import { getDb, getMeta, setMeta } from './db'
import { isProjectId, parseDownloadUrl, rememberProject } from './account'

const DAY_MS = 24 * 60 * 60 * 1000
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000
const FLUSH_MS = 30_000
const FLUSH_SIZE = 500
const REPEAT_WINDOW_MS = 10 * 60 * 1000
const REPEAT_MAX = 50_000
const LOOKUP_RETRY_MS = 60 * 60 * 1000
const LOOKUP_CONCURRENCY = 3
const CHART_DAYS = 20
const SINCE_KEY = 'download_counts_since'
const APP_SINCE_KEY = 'app_download_counts_since'
const APP_FIELDS = {
  edition: ['modrinth', 'astral'],
  platform: ['windows', 'macos', 'linux'],
  format: ['exe', 'msi', 'dmg', 'flathub', 'appimage', 'deb', 'rpm'],
  place: ['hero', 'card', 'files'],
}

const state = (globalThis.__downloadCounter ??= {
  pending: new Map(),
  timer: null,
  repeats: new Map(),
  lookups: new Map(),
  lookupsRunning: 0,
})
state.appPending ??= new Map()

function mskDay(ms) {
  return Math.floor((ms + MSK_OFFSET_MS) / DAY_MS)
}

function repeatKey(ip, url) {
  return createHash('sha256').update(`${ip}\n${url}`).digest('base64url').slice(0, 22)
}

function isRepeat(ip, url, now) {
  for (const [key, until] of state.repeats) {
    if (until > now) break
    state.repeats.delete(key)
  }
  const key = repeatKey(ip, url)
  const until = state.repeats.get(key)
  if (until && until > now) return true
  state.repeats.delete(key)
  if (state.repeats.size >= REPEAT_MAX) state.repeats.delete(state.repeats.keys().next().value)
  state.repeats.set(key, now + REPEAT_WINDOW_MS)
  return false
}

function flush() {
  if (state.timer) {
    clearTimeout(state.timer)
    state.timer = null
  }
  flushApp()
  if (state.pending.size === 0) return
  const rows = [...state.pending.entries()]
  state.pending.clear()
  try {
    const db = getDb()
    const upsert = db.prepare(
      `INSERT INTO download_counts (day, project_id, n) VALUES (?, ?, ?)
       ON CONFLICT(day, project_id) DO UPDATE SET n = n + excluded.n`,
    )
    db.transaction(() => {
      for (const [key, n] of rows) {
        const [day, projectId] = key.split('|')
        upsert.run(Number(day), projectId, n)
      }
    })()
    if (!getMeta(SINCE_KEY)) setMeta(SINCE_KEY, Date.now())
  } catch (error) {
    console.warn('Download counter flush failed:', error?.message)
  }
}

function flushApp() {
  if (state.appPending.size === 0) return
  const rows = [...state.appPending.entries()]
  state.appPending.clear()
  try {
    const db = getDb()
    const upsert = db.prepare(
      `INSERT INTO app_download_counts (day, edition, platform, format, place, n) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(day, edition, platform, format, place) DO UPDATE SET n = n + excluded.n`,
    )
    db.transaction(() => {
      for (const [key, n] of rows) {
        const [day, edition, platform, format, place] = key.split('|')
        upsert.run(Number(day), edition, platform, format, place, n)
      }
    })()
    if (!getMeta(APP_SINCE_KEY)) setMeta(APP_SINCE_KEY, Date.now())
  } catch (error) {
    console.warn('App download counter flush failed:', error?.message)
  }
}

function scheduleFlush() {
  if (state.pending.size + state.appPending.size >= FLUSH_SIZE) return flush()
  if (state.timer) return
  state.timer = setTimeout(flush, FLUSH_MS)
  state.timer.unref?.()
}

function learnProject(projectId, now) {
  const last = state.lookups.get(projectId)
  if (last && now - last < LOOKUP_RETRY_MS) return
  if (state.lookupsRunning >= LOOKUP_CONCURRENCY) return
  try {
    if (getDb().prepare('SELECT 1 FROM projects WHERE id = ?').get(projectId)) return
  } catch {
    return
  }
  state.lookups.set(projectId, now)
  state.lookupsRunning += 1
  rememberProject(projectId)
    .catch(() => null)
    .finally(() => {
      state.lookupsRunning -= 1
    })
}

export function countDownload(url, ip, now = Date.now()) {
  const download = parseDownloadUrl(url)
  if (!download || !isProjectId(download.projectId)) return false
  if (isRepeat(ip, url, now)) return false
  const key = `${mskDay(now)}|${download.projectId}`
  state.pending.set(key, (state.pending.get(key) || 0) + 1)
  scheduleFlush()
  learnProject(download.projectId, now)
  return true
}

export function getDownloadStats(now = Date.now()) {
  flush()
  const db = getDb()
  const today = mskDay(now)
  const from = today - (CHART_DAYS - 1)
  const perDay = new Map(
    db
      .prepare('SELECT day, SUM(n) AS n FROM download_counts WHERE day >= ? GROUP BY day')
      .all(from)
      .map((row) => [row.day, row.n]),
  )
  const days = Array.from({ length: CHART_DAYS }, (_, index) => {
    const day = from + index
    return { date: day * DAY_MS, count: perDay.get(day) || 0 }
  })
  const since = Number(getMeta(SINCE_KEY)) || null
  return {
    total: db.prepare('SELECT COALESCE(SUM(n), 0) AS n FROM download_counts').get().n,
    today: perDay.get(today) || 0,
    month: days.reduce((sum, day) => sum + day.count, 0),
    days,
    since,
    types: db
      .prepare(
        `SELECT COALESCE(projects.project_type, 'unknown') AS type, SUM(download_counts.n) AS n
         FROM download_counts LEFT JOIN projects ON projects.id = download_counts.project_id
         GROUP BY type ORDER BY n DESC`,
      )
      .all(),
  }
}

export function countAppDownload(id, ip, now = Date.now()) {
  if (typeof id !== 'string' || id.length > 64) return false
  const parts = id.split(':')
  const names = Object.keys(APP_FIELDS)
  if (parts.length !== names.length) return false
  if (!names.every((name, index) => APP_FIELDS[name].includes(parts[index]))) return false
  if (isRepeat(ip, `app:${parts.slice(0, 3).join(':')}`, now)) return false
  const key = `${mskDay(now)}|${parts.join('|')}`
  state.appPending.set(key, (state.appPending.get(key) || 0) + 1)
  scheduleFlush()
  return true
}

export function getAppDownloadStats(now = Date.now()) {
  flush()
  const db = getDb()
  const today = mskDay(now)
  const from = today - (CHART_DAYS - 1)
  const perDay = new Map(
    db
      .prepare('SELECT day, SUM(n) AS n FROM app_download_counts WHERE day >= ? GROUP BY day')
      .all(from)
      .map((row) => [row.day, row.n]),
  )
  const days = Array.from({ length: CHART_DAYS }, (_, index) => {
    const day = from + index
    return { date: day * DAY_MS, count: perDay.get(day) || 0 }
  })
  const split = (column) =>
    db.prepare(`SELECT ${column} AS type, SUM(n) AS n FROM app_download_counts GROUP BY ${column} ORDER BY n DESC`).all()
  return {
    total: db.prepare('SELECT COALESCE(SUM(n), 0) AS n FROM app_download_counts').get().n,
    today: perDay.get(today) || 0,
    month: days.reduce((sum, day) => sum + day.count, 0),
    days,
    since: Number(getMeta(APP_SINCE_KEY)) || null,
    editions: split('edition'),
    platforms: split('platform'),
    formats: split('format'),
    places: split('place'),
  }
}
