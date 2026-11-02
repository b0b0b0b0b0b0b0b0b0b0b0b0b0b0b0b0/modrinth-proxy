import { getDb } from './db'

const COLUMNS = {
  ghosts: 'ghosts_caught',
  ornaments: 'ornaments_caught',
  cookies: 'cookies_eaten',
  diamonds: 'diamonds_caught',
}

export class AccountFestiveScore {
  static max = 50000000
  static kinds = Object.keys(COLUMNS)
  static devicePattern = /^[A-Za-z0-9_-]{16,64}$/

  constructor(db = getDb()) {
    this.db = db
  }

  read(userId) {
    const row = this.db
      .prepare('SELECT ghosts_caught, ornaments_caught, cookies_eaten, diamonds_caught FROM users WHERE id = ?')
      .get(userId)
    return Object.fromEntries(
      AccountFestiveScore.kinds.map((kind) => [kind, AccountFestiveScore.normalize(row?.[COLUMNS[kind]])]),
    )
  }

  absorb(userId, deviceId, incoming) {
    return this.db.transaction(() => {
      const totals = this.read(userId)
      const result = { account: userId }
      for (const kind of AccountFestiveScore.kinds) {
        const pocket = AccountFestiveScore.normalize(incoming[kind].pocket)
        const guest = AccountFestiveScore.normalize(incoming[kind].guest)
        const pocketRow = this.db
          .prepare('SELECT applied FROM festive_pockets WHERE user_id = ? AND device_id = ? AND kind = ?')
          .get(userId, deviceId, kind)
        const pocketApplied = AccountFestiveScore.normalize(pocketRow?.applied)
        const guestRow = this.db
          .prepare('SELECT user_id, applied FROM festive_guests WHERE device_id = ? AND kind = ?')
          .get(deviceId, kind)
        const guestOpen = !guestRow || Number(guestRow.user_id) === Number(userId)
        const guestApplied = guestOpen ? AccountFestiveScore.normalize(guestRow?.applied) : 0
        let room = AccountFestiveScore.max - totals[kind]
        const takePocket = Math.min(room, Math.max(0, pocket - pocketApplied))
        room -= takePocket
        const takeGuest = guestOpen ? Math.min(room, Math.max(0, guest - guestApplied)) : 0
        const added = takePocket + takeGuest
        const nextPocket = pocketApplied + takePocket
        const nextGuest = guestApplied + takeGuest
        if (added > 0) {
          totals[kind] += added
          this.db.prepare(`UPDATE users SET ${COLUMNS[kind]} = ? WHERE id = ?`).run(totals[kind], userId)
        }
        if (nextPocket !== pocketApplied) {
          this.db
            .prepare(
              `INSERT INTO festive_pockets (user_id, device_id, kind, applied) VALUES (?, ?, ?, ?)
               ON CONFLICT(user_id, device_id, kind) DO UPDATE SET applied = excluded.applied`,
            )
            .run(userId, deviceId, kind, nextPocket)
        }
        if (guestOpen && guest > 0 && (!guestRow || nextGuest !== guestApplied)) {
          if (!guestRow) {
            this.db
              .prepare('INSERT INTO festive_guests (device_id, kind, user_id, applied) VALUES (?, ?, ?, ?)')
              .run(deviceId, kind, userId, nextGuest)
          } else {
            this.db
              .prepare('UPDATE festive_guests SET applied = ? WHERE device_id = ? AND kind = ?')
              .run(nextGuest, deviceId, kind)
          }
        }
        result[kind] = {
          total: totals[kind],
          added,
          pocket: nextPocket,
          guest: guestOpen ? nextGuest : 0,
          guestOpen,
        }
      }
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
