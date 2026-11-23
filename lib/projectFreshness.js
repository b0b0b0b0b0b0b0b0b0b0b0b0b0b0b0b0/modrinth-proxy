import { MODRINTH_API } from './modrinth'
import { isModrinthBusy } from './modrinthTraffic'
import { noteProjects } from './versionWatch'

const MINUTE_MS = 60 * 1000
const TICK_MS = 2 * MINUTE_MS
const START_DELAY_MS = 60 * 1000
const RECHECK_MS = 10 * MINUTE_MS
const VIEW_WINDOW_MS = 24 * 60 * MINUTE_MS
const MAX_TRACKED = 20000
const CHUNK = 100
const MAX_CHUNKS_PER_TICK = 4
const TIMEOUT_MS = 20 * 1000
const ID_RE = /^[A-Za-z0-9]{8}$/

const tracked = (globalThis.__projectFreshness ??= new Map())

export function noteProjectView(projectId) {
  if (typeof projectId !== 'string' || !ID_RE.test(projectId)) return
  const now = Date.now()
  const entry = tracked.get(projectId)
  if (entry) {
    tracked.delete(projectId)
    entry.viewed = now
    tracked.set(projectId, entry)
    return
  }
  tracked.set(projectId, { viewed: now, checked: now })
  while (tracked.size > MAX_TRACKED) tracked.delete(tracked.keys().next().value)
}

function dueIds(now) {
  const due = []
  for (const [id, entry] of tracked) {
    if (now - entry.viewed > VIEW_WINDOW_MS) {
      tracked.delete(id)
      continue
    }
    if (now - entry.checked >= RECHECK_MS) due.push([id, entry])
  }
  return due.sort((a, b) => a[1].checked - b[1].checked).slice(0, CHUNK * MAX_CHUNKS_PER_TICK)
}

async function checkChunk(chunk) {
  const ids = chunk.map(([id]) => id)
  const response = await fetch(`${MODRINTH_API}/projects?ids=${encodeURIComponent(JSON.stringify(ids))}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) return false
  const projects = await response.json()
  if (!Array.isArray(projects)) return false
  noteProjects(projects)
  const now = Date.now()
  for (const [, entry] of chunk) entry.checked = now
  return true
}

async function tick() {
  if (globalThis.__projectFreshnessBusy) return
  globalThis.__projectFreshnessBusy = true
  try {
    const due = dueIds(Date.now())
    for (let i = 0; i < due.length; i += CHUNK) {
      if (isModrinthBusy()) return
      if (!(await checkChunk(due.slice(i, i + CHUNK)).catch(() => false))) return
    }
  } finally {
    globalThis.__projectFreshnessBusy = false
  }
}

export function startProjectFreshness() {
  if (globalThis.__projectFreshnessTimer) return
  const starter = setTimeout(() => {
    tick()
    globalThis.__projectFreshnessTimer = setInterval(tick, TICK_MS)
    globalThis.__projectFreshnessTimer.unref?.()
  }, START_DELAY_MS)
  starter.unref?.()
  globalThis.__projectFreshnessTimer = starter
}
