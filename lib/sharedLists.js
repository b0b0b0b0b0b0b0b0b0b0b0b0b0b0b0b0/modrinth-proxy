import { createHash } from 'crypto'
import { getDb } from './db'
import { buildFavoritesCode, parseFavoritesCode } from './account'

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ID_RE = /^[0-9A-Za-z]{7,12}$/
const MIN_LENGTH = 7
const MAX_LENGTH = 12
const KEEP_MS = 180 * 24 * 60 * 60 * 1000

function slug(code, length) {
  let value = BigInt(`0x${createHash('sha256').update(code).digest('hex')}`)
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Number(value % 62n)]
    value /= 62n
  }
  return out
}

export function shareList(code) {
  const ids = parseFavoritesCode(code)
  if (!ids) return null
  const normalized = buildFavoritesCode(ids)
  const db = getDb()
  const now = Date.now()
  for (let length = MIN_LENGTH; length <= MAX_LENGTH; length += 1) {
    const id = slug(normalized, length)
    const row = db.prepare('SELECT code FROM shared_lists WHERE id = ?').get(id)
    if (!row) {
      db.prepare('INSERT INTO shared_lists (id, code, created_at, used_at) VALUES (?, ?, ?, ?)').run(id, normalized, now, now)
      return id
    }
    if (row.code === normalized) {
      db.prepare('UPDATE shared_lists SET used_at = ? WHERE id = ?').run(now, id)
      return id
    }
  }
  return null
}

export function resolveList(id) {
  if (typeof id !== 'string' || !ID_RE.test(id)) return null
  const db = getDb()
  const row = db.prepare('SELECT code FROM shared_lists WHERE id = ?').get(id)
  if (!row || !parseFavoritesCode(row.code)) return null
  db.prepare('UPDATE shared_lists SET used_at = ? WHERE id = ?').run(Date.now(), id)
  return row.code
}

export function pruneSharedLists() {
  return getDb().prepare('DELETE FROM shared_lists WHERE used_at < ?').run(Date.now() - KEEP_MS).changes
}
