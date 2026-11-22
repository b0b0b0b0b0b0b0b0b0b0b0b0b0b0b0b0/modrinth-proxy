import { getDb } from './db'

const REFRESH_MS = 6 * 60 * 60 * 1000

export function saveOrganizationCopy(id, data) {
  if (typeof id !== 'string' || !id || !data?.id) return
  try {
    const db = getDb()
    const json = JSON.stringify(data)
    const row = db.prepare('SELECT data, at FROM organization_copies WHERE id = ?').get(id)
    if (row && row.data === json && Date.now() - row.at < REFRESH_MS) return
    db.prepare(
      `INSERT INTO organization_copies (id, data, at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, at = excluded.at`,
    ).run(id, json, Date.now())
  } catch {}
}

export function organizationCopy(id) {
  if (typeof id !== 'string' || !id) return null
  try {
    const row = getDb().prepare('SELECT data FROM organization_copies WHERE id = ?').get(id)
    return row ? JSON.parse(row.data) : null
  } catch {
    return null
  }
}

export function forgetOrganizationCopy(id) {
  if (typeof id !== 'string' || !id) return
  try {
    getDb().prepare('DELETE FROM organization_copies WHERE id = ?').run(id)
  } catch {}
}
