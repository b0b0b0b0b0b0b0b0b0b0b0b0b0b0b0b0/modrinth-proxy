import fs from 'fs'
import path from 'path'

const RECHECK_MS = 30 * 1000
const files = (globalThis.__idListFiles ??= new Map())

function toIds(entries) {
  const ids = new Set()
  if (!Array.isArray(entries)) return ids
  for (const entry of entries) {
    const id = Number(typeof entry === 'object' && entry !== null ? entry.id : entry)
    if (Number.isInteger(id) && id > 0) ids.add(id)
  }
  return ids
}

export function readIdList(name, fallback = []) {
  const file = path.join(process.cwd(), 'data', name)
  let entry = files.get(file)
  if (!entry) {
    entry = { checkedAt: 0, mtime: null, ids: new Set(fallback) }
    files.set(file, entry)
  }
  const now = Date.now()
  if (now - entry.checkedAt < RECHECK_MS) return entry.ids
  entry.checkedAt = now
  try {
    const mtime = fs.statSync(file).mtimeMs
    if (mtime !== entry.mtime) {
      entry.ids = toIds(JSON.parse(fs.readFileSync(file, 'utf8')))
      entry.mtime = mtime
    }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      entry.ids = new Set(fallback)
      entry.mtime = null
    }
  }
  return entry.ids
}
