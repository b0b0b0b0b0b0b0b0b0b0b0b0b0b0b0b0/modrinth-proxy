import { getDb } from './db'
import { readIdList } from './idListFile'
import { makeGrumpy } from './autoGrumpy'

const HOUR_MS = 60 * 60 * 1000
const KEEP_HOURS = 24 * 7
const WINDOW_HOURS = 24
const NONSTOP_HOURS = 6
const BAN_FAST_FACTOR = 2
const BAN_BUSY_SHARE = 0.25
const BAN_BUSY_HOURS = 10

export const PLAY_KINDS = ['diamonds', 'pets', 'ghosts', 'ornaments', 'cookies']

export const PLAY_CEILINGS = {
  diamonds: 2400,
  pets: 18000,
  ghosts: 3600,
  ornaments: 3300,
  cookies: 3600,
}

export const HAND_LIMITS = { ...PLAY_CEILINGS, pets: 3000 }

const state = (globalThis.__playWatch ??= { prunedHour: 0 })
const allowances = (globalThis.__playAllowances ??= new Map())

export function takePlayAllowance(userId, kind, wanted) {
  const ceiling = PLAY_CEILINGS[kind]
  const want = Math.max(0, Math.floor(Number(wanted) || 0))
  if (!ceiling || !want) return 0
  const now = Date.now()
  if (allowances.size > 5000) {
    for (const [key, entry] of allowances) if (now - entry.at > HOUR_MS) allowances.delete(key)
  }
  const key = `${userId}:${kind}`
  const entry = allowances.get(key) ?? { tokens: ceiling, at: now }
  entry.tokens = Math.min(ceiling, entry.tokens + ((now - entry.at) / HOUR_MS) * ceiling)
  entry.at = now
  const granted = Math.min(want, Math.floor(entry.tokens))
  entry.tokens -= granted
  allowances.set(key, entry)
  return granted
}

const KIND_NAMES = {
  diamonds: 'алмазов',
  pets: 'поглаживаний',
  ghosts: 'призраков',
  ornaments: 'игрушек',
  cookies: 'печенек',
}

const spaced = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

function verdict(db, userId, kind, hour, total, amount) {
  const limit = HAND_LIMITS[kind]
  if (total > limit * BAN_FAST_FACTOR) {
    return `сам: ${spaced(total)} ${KIND_NAMES[kind]} за час, руками до ${spaced(limit)}`
  }
  const busy = limit * BAN_BUSY_SHARE
  if (total < busy || total - amount >= busy) return null
  const hours = db
    .prepare('SELECT COUNT(*) AS c FROM play_hours WHERE user_id = ? AND kind = ? AND hour > ? AND n >= ?')
    .get(userId, kind, hour - WINDOW_HOURS, busy).c
  if (hours < BAN_BUSY_HOURS) return null
  return `сам: ${hours} ч из ${WINDOW_HOURS} без перерыва, ${KIND_NAMES[kind]} от ${spaced(busy)} в час`
}

export function notePlay(userId, kind, amount) {
  const n = Math.floor(Number(amount) || 0)
  if (n <= 0 || !PLAY_CEILINGS[kind]) return false
  const hour = Math.floor(Date.now() / HOUR_MS)
  const db = getDb()
  const total = db
    .prepare(
      `INSERT INTO play_hours (user_id, hour, kind, n) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, hour, kind) DO UPDATE SET n = n + excluded.n
       RETURNING n`,
    )
    .get(userId, hour, kind, n).n
  if (state.prunedHour !== hour) {
    state.prunedHour = hour
    db.prepare('DELETE FROM play_hours WHERE hour < ?').run(hour - KEEP_HOURS)
  }
  const why = verdict(db, userId, kind, hour, total, n)
  return why ? makeGrumpy(db, userId, why) : false
}

export function readPlaySuspects() {
  const from = Math.floor(Date.now() / HOUR_MS) - WINDOW_HOURS + 1
  const rows = getDb()
    .prepare(
      `SELECT p.user_id AS id, u.username, p.hour, p.kind, p.n
       FROM play_hours p JOIN users u ON u.id = p.user_id
       WHERE p.hour >= ?`,
    )
    .all(from)
  const grumpy = readIdList('grumpy-kittens.json')
  const users = new Map()
  for (const row of rows) {
    if (grumpy.has(Number(row.id))) continue
    const user = users.get(row.id) ?? { id: row.id, username: row.username, hours: new Set(), kinds: {} }
    const kind = (user.kinds[row.kind] ??= { total: 0, peak: 0 })
    kind.total += row.n
    kind.peak = Math.max(kind.peak, row.n)
    user.hours.add(row.hour)
    users.set(row.id, user)
  }
  const suspects = []
  for (const user of users.values()) {
    const fast = PLAY_KINDS.filter((kind) => user.kinds[kind]?.peak > HAND_LIMITS[kind]).map((kind) => ({
      kind,
      peak: user.kinds[kind].peak,
      limit: HAND_LIMITS[kind],
    }))
    const activeHours = user.hours.size
    if (!fast.length && activeHours < NONSTOP_HOURS) continue
    const worst = Math.max(0, ...fast.map((item) => item.peak / item.limit))
    suspects.push({
      id: user.id,
      username: user.username,
      fast,
      activeHours,
      nonstop: activeHours >= NONSTOP_HOURS,
      totals: PLAY_KINDS.filter((kind) => user.kinds[kind]).map((kind) => ({ kind, n: user.kinds[kind].total })),
      worst,
    })
  }
  return suspects.sort((a, b) => b.worst - a.worst || b.activeHours - a.activeHours)
}

export const PLAY_WINDOW_HOURS = WINDOW_HOURS
export const PLAY_NONSTOP_HOURS = NONSTOP_HOURS
