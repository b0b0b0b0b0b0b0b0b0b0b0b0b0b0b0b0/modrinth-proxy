import { getDb } from './db'
import { serializeWorkspace, summarizeWorkspace } from './toolWorkspaceSchema'

const BACKUPS_KEEP = 20
const AUTO_BACKUP_EVERY_MS = 30 * 60 * 1000
const SAVE_REASONS = new Set(['auto', 'transfer', 'merge'])
const BACKUP_REASONS = new Set(['auto', 'transfer', 'merge', 'restore'])
const SAVES_PER_MINUTE = 40
const IDLE_FORGET_MS = 10 * 60 * 1000

const buckets = (globalThis.__toolWorkspaceBuckets ??= new Map())

function allowSave(userId) {
  const now = Date.now()
  if (buckets.size > 2000) {
    for (const [id, entry] of buckets) {
      if (now - entry.at > IDLE_FORGET_MS) buckets.delete(id)
    }
  }
  const entry = buckets.get(userId) ?? { tokens: SAVES_PER_MINUTE, at: now }
  entry.tokens = Math.min(SAVES_PER_MINUTE, entry.tokens + ((now - entry.at) / 60000) * SAVES_PER_MINUTE)
  entry.at = now
  if (entry.tokens < 1) {
    buckets.set(userId, entry)
    return false
  }
  entry.tokens -= 1
  buckets.set(userId, entry)
  return true
}

function parseStored(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isUserId(value) {
  return Number.isSafeInteger(value) && value > 0
}

export function isBackupId(value) {
  return Number.isSafeInteger(value) && value > 0
}

export function readToolWorkspace(userId) {
  if (!isUserId(userId)) return null
  const row = getDb()
    .prepare('SELECT data, revision, updated_at FROM tool_workspaces WHERE user_id = ?')
    .get(userId)
  if (!row) return null
  return { data: parseStored(row.data), revision: row.revision, updatedAt: row.updated_at }
}

function insertBackup(db, userId, json, reason, now) {
  const summary = JSON.stringify(summarizeWorkspace(parseStored(json)))
  db.prepare('INSERT INTO tool_workspace_backups (user_id, data, reason, summary, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(userId, json, BACKUP_REASONS.has(reason) ? reason : 'auto', summary, now)
  db.prepare(
    `DELETE FROM tool_workspace_backups
     WHERE user_id = ? AND id NOT IN (
       SELECT id FROM tool_workspace_backups WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?
     )`,
  ).run(userId, userId, BACKUPS_KEEP)
}

function writeWorkspace(userId, json, reason, baseRevision) {
  const db = getDb()
  const now = Date.now()
  return db.transaction(() => {
    const current = db
      .prepare('SELECT data, revision, backed_up_at FROM tool_workspaces WHERE user_id = ?')
      .get(userId)
    if (current && reason === 'auto' && baseRevision !== current.revision) {
      return { ok: false, conflict: true, revision: current.revision }
    }
    if (current && current.data === json) {
      return { ok: true, revision: current.revision, unchanged: true }
    }
    let backedUpAt = current?.backed_up_at ?? 0
    if (current && (reason !== 'auto' || now - backedUpAt >= AUTO_BACKUP_EVERY_MS)) {
      insertBackup(db, userId, current.data, reason, now)
      backedUpAt = now
    }
    const revision = (current?.revision ?? 0) + 1
    db.prepare(
      `INSERT INTO tool_workspaces (user_id, data, revision, updated_at, backed_up_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, revision = excluded.revision,
         updated_at = excluded.updated_at, backed_up_at = excluded.backed_up_at`,
    ).run(userId, json, revision, now, backedUpAt)
    return { ok: true, revision }
  })()
}

export function saveToolWorkspace(userId, input, { reason = 'auto', baseRevision = null } = {}) {
  if (!isUserId(userId)) return { ok: false, error: 'user' }
  if (!SAVE_REASONS.has(reason)) return { ok: false, error: 'reason' }
  if (reason === 'auto' && baseRevision !== null && !Number.isSafeInteger(baseRevision)) return { ok: false, error: 'revision' }
  if (!allowSave(userId)) return { ok: false, error: 'rate' }
  const serialized = serializeWorkspace(input)
  if (!serialized) return { ok: false, error: 'invalid' }
  return writeWorkspace(userId, serialized.json, reason, baseRevision)
}

export function listToolWorkspaceBackups(userId) {
  if (!isUserId(userId)) return []
  return getDb()
    .prepare('SELECT id, reason, summary, created_at FROM tool_workspace_backups WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?')
    .all(userId, BACKUPS_KEEP)
    .map((row) => ({ id: row.id, reason: row.reason, createdAt: row.created_at, summary: parseStored(row.summary) }))
}

export function readToolWorkspaceBackup(userId, backupId) {
  if (!isUserId(userId) || !isBackupId(backupId)) return null
  const row = getDb()
    .prepare('SELECT id, reason, data, created_at FROM tool_workspace_backups WHERE user_id = ? AND id = ?')
    .get(userId, backupId)
  if (!row) return null
  return { id: row.id, reason: row.reason, createdAt: row.created_at, data: parseStored(row.data) }
}

export function restoreToolWorkspaceBackup(userId, backupId) {
  if (!isUserId(userId) || !isBackupId(backupId)) return { ok: false, error: 'id' }
  if (!allowSave(userId)) return { ok: false, error: 'rate' }
  const db = getDb()
  const row = db
    .prepare('SELECT data FROM tool_workspace_backups WHERE user_id = ? AND id = ?')
    .get(userId, backupId)
  if (!row) return { ok: false, error: 'missing' }
  const serialized = serializeWorkspace(parseStored(row.data))
  if (!serialized) return { ok: false, error: 'invalid' }
  const now = Date.now()
  return db.transaction(() => {
    const current = db.prepare('SELECT data, revision FROM tool_workspaces WHERE user_id = ?').get(userId)
    if (current) insertBackup(db, userId, current.data, 'restore', now)
    const revision = (current?.revision ?? 0) + 1
    db.prepare(
      `INSERT INTO tool_workspaces (user_id, data, revision, updated_at, backed_up_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, revision = excluded.revision,
         updated_at = excluded.updated_at, backed_up_at = excluded.backed_up_at`,
    ).run(userId, serialized.json, revision, now, now)
    return { ok: true, revision, data: serialized.clean }
  })()
}
