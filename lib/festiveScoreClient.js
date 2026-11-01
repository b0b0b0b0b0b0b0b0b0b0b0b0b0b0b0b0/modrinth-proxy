import { readCookieScore, writeCookieScore } from './birthday'
import { readGhostScore, writeGhostScore } from './halloween'
import { readTree, writeTree } from './newYear'

const LEDGER_KEY = 'festiveScoreLedger'
const KINDS = ['ghosts', 'ornaments', 'cookies']
const LIMIT = 50000000

function count(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 0
  return Math.min(LIMIT, Math.floor(number))
}

function deviceId() {
  const raw = globalThis.crypto?.randomUUID?.()
  if (raw) return raw.replace(/-/g, '')
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
}

function blankKind() {
  return { guest: 0, guestApplied: 0, guestOwner: '', holding: 0, pockets: {} }
}

function blank() {
  return {
    deviceId: deviceId(),
    imported: false,
    kinds: Object.fromEntries(KINDS.map((kind) => [kind, blankKind()])),
    totals: {},
  }
}

export class FestiveLedger {
  constructor() {
    this.data = null
  }

  ensure() {
    if (typeof window === 'undefined') return false
    if (this.data) return true
    const stored = this.readDisk()
    this.data = stored ? this.repair(stored) : blank()
    if (!this.data.imported) {
      this.importLegacy()
      this.data.imported = true
    }
    this.persist()
    return true
  }

  readDisk() {
    try {
      const value = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null')
      if (!value || typeof value !== 'object' || !value.kinds) return null
      return value
    } catch {
      return null
    }
  }

  repair(value) {
    const data = blank()
    if (typeof value.deviceId === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(value.deviceId)) data.deviceId = value.deviceId
    data.imported = Boolean(value.imported)
    for (const kind of KINDS) {
      const row = value.kinds?.[kind] || {}
      const next = blankKind()
      next.guest = count(row.guest)
      next.guestApplied = Math.min(next.guest, count(row.guestApplied))
      next.guestOwner = typeof row.guestOwner === 'string' ? row.guestOwner : ''
      next.holding = count(row.holding)
      const pockets = row.pockets && typeof row.pockets === 'object' ? row.pockets : {}
      for (const [id, pocket] of Object.entries(pockets)) {
        if (!/^\d+$/.test(id)) continue
        const caught = count(pocket?.caught)
        next.pockets[id] = { caught, applied: Math.min(caught, count(pocket?.applied)) }
      }
      data.kinds[kind] = next
    }
    const totals = value.totals && typeof value.totals === 'object' ? value.totals : {}
    for (const [id, scores] of Object.entries(totals)) {
      if (!/^\d+$/.test(id) || !scores || typeof scores !== 'object') continue
      data.totals[id] = Object.fromEntries(KINDS.map((kind) => [kind, count(scores[kind])]))
    }
    return data
  }

  importLegacy() {
    this.data.kinds.ghosts.guest = Math.max(this.data.kinds.ghosts.guest, count(readGhostScore()))
    this.data.kinds.cookies.guest = Math.max(this.data.kinds.cookies.guest, count(readCookieScore()))
    this.data.kinds.ornaments.guest = Math.max(this.data.kinds.ornaments.guest, count(readTree().total))
  }

  reload() {
    if (!this.ensure()) return
    const disk = this.readDisk()
    if (disk) this.data = this.merge(this.repair(disk), this.data)
  }

  merge(left, right) {
    const data = blank()
    data.deviceId = left.deviceId || right.deviceId
    data.imported = left.imported || right.imported
    for (const kind of KINDS) {
      const a = left.kinds[kind]
      const b = right.kinds[kind]
      const next = blankKind()
      next.guest = Math.max(a.guest, b.guest)
      next.guestApplied = Math.min(next.guest, Math.max(a.guestApplied, b.guestApplied))
      next.guestOwner = this.pickOwner(a.guestOwner, b.guestOwner)
      next.holding = Math.max(a.holding, b.holding)
      for (const id of new Set([...Object.keys(a.pockets), ...Object.keys(b.pockets)])) {
        const caught = Math.max(a.pockets[id]?.caught || 0, b.pockets[id]?.caught || 0)
        next.pockets[id] = {
          caught,
          applied: Math.min(caught, Math.max(a.pockets[id]?.applied || 0, b.pockets[id]?.applied || 0)),
        }
      }
      data.kinds[kind] = next
    }
    for (const id of new Set([...Object.keys(left.totals), ...Object.keys(right.totals)])) {
      data.totals[id] = {}
      for (const kind of KINDS) {
        data.totals[id][kind] = Math.max(left.totals[id]?.[kind] || 0, right.totals[id]?.[kind] || 0)
      }
    }
    return data
  }

  pickOwner(left, right) {
    if (left && left !== 'taken') return left
    if (right && right !== 'taken') return right
    return left || right || ''
  }

  persist() {
    const disk = this.readDisk()
    if (disk) this.data = this.merge(this.repair(disk), this.data)
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(this.data))
    } catch {}
    this.mirror()
  }

  unapplied(kind) {
    const row = this.data.kinds[kind]
    const pockets = Object.values(row.pockets).reduce((sum, pocket) => sum + Math.max(0, pocket.caught - pocket.applied), 0)
    const guest = !row.guestOwner || row.guestOwner !== 'taken' ? Math.max(0, row.guest - row.guestApplied) : 0
    return guest + pockets + row.holding
  }

  mirror() {
    writeGhostScore(this.unapplied('ghosts'))
    writeCookieScore(this.unapplied('cookies'))
    const tree = readTree()
    const ornaments = this.unapplied('ornaments')
    if (tree.total !== ornaments) writeTree({ total: ornaments, hung: tree.hung })
  }

  row(kind) {
    return this.data.kinds[kind]
  }

  pocket(kind, accountId) {
    const row = this.row(kind)
    if (!row.pockets[accountId]) row.pockets[accountId] = { caught: 0, applied: 0 }
    return row.pockets[accountId]
  }

  catch(kind, accountId, signed) {
    if (!this.ensure()) return 0
    this.reload()
    const row = this.row(kind)
    if (signed && accountId) this.pocket(kind, accountId).caught += 1
    else if (!signed && row.guestOwner !== 'taken') row.guest += 1
    else row.holding += 1
    this.persist()
    return this.shown(kind, signed ? accountId : '')
  }

  known(kind, accountId) {
    if (!accountId) return 0
    return this.data.totals[accountId]?.[kind] || 0
  }

  pending(kind, accountId) {
    const row = this.row(kind)
    const guest = !row.guestOwner || !accountId || row.guestOwner === accountId ? Math.max(0, row.guest - row.guestApplied) : 0
    const pocket = accountId ? Math.max(0, (row.pockets[accountId]?.caught || 0) - (row.pockets[accountId]?.applied || 0)) : 0
    const loose = accountId ? 0 : Object.values(row.pockets).reduce((sum, item) => sum + item.caught, 0)
    return guest + pocket + row.holding + (accountId ? 0 : loose)
  }

  shown(kind, accountId) {
    if (!this.ensure()) return 0
    if (!accountId) {
      const row = this.row(kind)
      return row.guest + row.holding + Object.values(row.pockets).reduce((sum, pocket) => sum + pocket.caught, 0)
    }
    return this.known(kind, accountId) + this.pending(kind, accountId)
  }

  hasPending(accountId) {
    if (!this.ensure()) return false
    return KINDS.some((kind) => this.pending(kind, accountId) > 0)
  }

  payload(accountId) {
    this.reload()
    const body = { deviceId: this.data.deviceId }
    for (const kind of KINDS) {
      const row = this.row(kind)
      const sendGuest = row.guestOwner !== 'taken' && (!row.guestOwner || !accountId || row.guestOwner === accountId)
      body[kind] = {
        pocket: accountId ? row.pockets[accountId]?.caught || 0 : 0,
        guest: sendGuest ? row.guest : 0,
      }
    }
    return body
  }

  confirm(accountId, saved) {
    if (!this.ensure()) return false
    this.reload()
    if (!this.data.totals[accountId]) this.data.totals[accountId] = {}
    let again = false
    for (const kind of KINDS) {
      const got = saved[kind]
      const row = this.row(kind)
      const known = this.known(kind, accountId)
      if (!got || got.total < known || got.added < 0 || got.total < known + got.added) continue
      this.data.totals[accountId][kind] = got.total
      const pocket = this.pocket(kind, accountId)
      if (got.pocket > pocket.caught) pocket.caught = got.pocket
      pocket.applied = Math.max(pocket.applied, Math.min(pocket.caught, got.pocket))
      if (got.guestOpen) {
        if (!row.guestOwner || row.guestOwner === accountId) {
          if (row.guest > 0 || got.guest > 0) row.guestOwner = accountId
          if (got.guest > row.guest) row.guest = got.guest
          row.guestApplied = Math.min(row.guest, Math.max(row.guestApplied, got.guest))
        }
      } else if (!row.guestOwner) {
        row.guestOwner = 'taken'
      }
      if (row.holding > 0) {
        pocket.caught += row.holding
        row.holding = 0
        again = true
      }
    }
    this.persist()
    return again
  }
}

export class FestiveAccountApi {
  async absorb(payload, keepalive = false) {
    try {
      const response = await fetch('/api/account/festive', {
        method: 'POST',
        keepalive,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 401) return { unauthorized: true }
      if (!response.ok) return null
      const data = await response.json().catch(() => null)
      if (!data || !Number.isInteger(data.account) || data.account <= 0) return null
      for (const kind of KINDS) {
        const row = data[kind]
        if (!row || !Number.isInteger(row.total) || !Number.isInteger(row.added)) return null
        if (!Number.isInteger(row.pocket) || !Number.isInteger(row.guest) || typeof row.guestOpen !== 'boolean') return null
        if (row.total < 0 || row.added < 0 || row.pocket < 0 || row.guest < 0) return null
      }
      return data
    } catch {
      return null
    }
  }
}

export class FestiveScoreBook {
  constructor(ledger = new FestiveLedger(), api = new FestiveAccountApi()) {
    this.ledger = ledger
    this.api = api
    this.listeners = new Set()
    this.timer = null
    this.tail = Promise.resolve(false)
    this.accountId = ''
    this.session = 0
    this.floors = {}
    this.listening = false
  }

  signedIn() {
    return typeof document !== 'undefined' && document.cookie.includes('mp_signed=1')
  }

  listen() {
    if (this.listening || typeof window === 'undefined') return
    this.listening = true
    window.addEventListener('storage', (event) => {
      if (event.key && event.key !== LEDGER_KEY) return
      this.ledger.reload()
      this.publish()
      if (this.signedIn()) this.queue()
    })
  }

  shown(kind) {
    const raw = this.ledger.shown(kind, this.accountId)
    const key = this.accountId || 'local'
    if (!this.floors[key]) this.floors[key] = {}
    this.floors[key][kind] = Math.max(this.floors[key][kind] || 0, raw)
    return this.floors[key][kind]
  }

  snapshot() {
    const scores = Object.fromEntries(KINDS.map((kind) => [kind, this.shown(kind)]))
    return { ...scores, pending: this.signedIn() && (!this.accountId || this.ledger.hasPending(this.accountId)) }
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  publish() {
    const snap = this.snapshot()
    for (const listener of this.listeners) listener(snap)
  }

  catch(kind) {
    if (!KINDS.includes(kind)) return 0
    const signed = this.signedIn()
    const next = this.ledger.catch(kind, signed ? this.accountId : '', signed)
    this.publish()
    this.queue()
    return this.shown(kind) || next
  }

  claim() {
    if (!this.signedIn()) return Promise.resolve(false)
    return this.flush()
  }

  detach() {
    this.session += 1
    this.accountId = ''
    this.publish()
  }

  queue() {
    if (!this.signedIn()) return
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = null
      this.flush()
    }, 700)
  }

  queueLater(delay) {
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.flush()
    }, delay)
  }

  flush() {
    const run = this.tail.then(() => this.push(false))
    this.tail = run.then((value) => value).catch(() => false)
    return run
  }

  flushNow(keepalive = false) {
    if (!this.signedIn()) return Promise.resolve(false)
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (!keepalive) return this.flush()
    return this.push(true)
  }

  alive(session) {
    return session === this.session && this.signedIn()
  }

  async push(keepalive) {
    const session = this.session
    if (!this.signedIn()) return false
    const sent = this.ledger.payload(this.accountId)
    const saved = await this.api.absorb(sent, keepalive)
    if (saved?.unauthorized) return false
    if (!saved) {
      if (this.alive(session)) this.queueLater(4000)
      return false
    }
    const again = this.ledger.confirm(String(saved.account), saved)
    if (this.alive(session)) this.accountId = String(saved.account)
    this.publish()
    const now = this.ledger.payload(this.accountId)
    const more = KINDS.some((kind) => now[kind].pocket > sent[kind].pocket || now[kind].guest > sent[kind].guest)
    if (this.alive(session) && (again || more)) this.queue()
    return true
  }
}

export const festiveBook = new FestiveScoreBook()
