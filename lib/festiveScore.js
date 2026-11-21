import { getDb } from './db'
import { isGrumpyKitten } from './kittenPets'
import { notePlay, takePlayAllowance } from './playWatch'

const COLUMNS = {
  ghosts: 'ghosts_caught',
  ornaments: 'ornaments_caught',
  cookies: 'cookies_eaten',
  diamonds: 'diamonds_caught',
}

const HOUR_MS = 60 * 60 * 1000
const MAX_AWAY_HOURS = 24

export class AccountFestiveScore {
  static max = 50000000
  static kinds = Object.keys(COLUMNS)
  static devicePattern = /^[A-Za-z0-9_-]{16,64}$/

  constructor(db = getDb()) {
    this.db = db
  }

  read(userId) {
    if (isGrumpyKitten(userId)) return Object.fromEntries(AccountFestiveScore.kinds.map((kind) => [kind, 0]))
    const row = this.db
      .prepare('SELECT ghosts_caught, ornaments_caught, cookies_eaten, diamonds_caught FROM users WHERE id = ?')
      .get(userId)
    return Object.fromEntries(
      AccountFestiveScore.kinds.map((kind) => [kind, AccountFestiveScore.normalize(row?.[COLUMNS[kind]])]),
    )
  }

  awayHours(userId, kind, now, createdAt) {
    const last = this.db
      .prepare('SELECT MAX(at) AS at FROM festive_pockets WHERE user_id = ? AND kind = ?')
      .get(userId, kind)?.at
    const since = Number(last) || Number(createdAt) || now
    return Math.min(MAX_AWAY_HOURS, Math.max(1, (now - since) / HOUR_MS))
  }

  absorb(userId, deviceId, incoming) {
    let frozen = isGrumpyKitten(userId)
    return this.db.transaction(() => {
      const totals = this.read(userId)
      const result = { account: userId }
      const now = Date.now()
      const createdAt = this.db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId)?.created_at
      for (const kind of AccountFestiveScore.kinds) {
        const pocket = AccountFestiveScore.normalize(incoming[kind].pocket)
        const pocketRow = this.db
          .prepare('SELECT applied FROM festive_pockets WHERE user_id = ? AND device_id = ? AND kind = ?')
          .get(userId, deviceId, kind)
        const pocketApplied = AccountFestiveScore.normalize(pocketRow?.applied)
        const room = AccountFestiveScore.max - totals[kind]
        const takePocket = Math.min(room, Math.max(0, pocket - pocketApplied))
        const away = takePocket > 0 ? this.awayHours(userId, kind, now, createdAt) : 1
        if (!frozen && notePlay(userId, kind, takePocket, away)) frozen = true
        const added = frozen ? 0 : takePlayAllowance(userId, kind, takePocket, away)
        const nextPocket = pocketApplied + takePocket
        if (added > 0) {
          totals[kind] += added
          this.db.prepare(`UPDATE users SET ${COLUMNS[kind]} = ? WHERE id = ?`).run(totals[kind], userId)
        }
        if (nextPocket !== pocketApplied) {
          this.db
            .prepare(
              `INSERT INTO festive_pockets (user_id, device_id, kind, applied, at) VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(user_id, device_id, kind) DO UPDATE SET applied = excluded.applied, at = excluded.at`,
            )
            .run(userId, deviceId, kind, nextPocket, now)
        }
        result[kind] = {
          total: totals[kind],
          added,
          pocket: nextPocket,
          guest: 0,
          guestOpen: false,
        }
      }
      if (frozen) for (const kind of AccountFestiveScore.kinds) result[kind].total = 0
      return result
    })()
  }

  static normalize(value) {
    const count = Number(value)
    if (!Number.isFinite(count) || count <= 0) return 0
    return Math.min(AccountFestiveScore.max, Math.floor(count))
  }

  static validDevice(value) {
    return typeof value === 'string' && AccountFestiveScore.devicePattern.test(value)
  }

  static validReport(body) {
    if (!body || typeof body !== 'object' || !AccountFestiveScore.validDevice(body.deviceId)) return null
    const report = {}
    for (const kind of AccountFestiveScore.kinds) {
      const entry = body[kind] ?? { pocket: 0, guest: 0 }
      if (!entry || typeof entry !== 'object') return null
      if (!Number.isInteger(entry.pocket) || !Number.isInteger(entry.guest)) return null
      if (entry.pocket < 0 || entry.guest < 0) return null
      if (entry.pocket > AccountFestiveScore.max || entry.guest > AccountFestiveScore.max) return null
      report[kind] = { pocket: entry.pocket, guest: entry.guest }
    }
    return { deviceId: body.deviceId, report }
  }
}
