import { getDb } from './db'

export const COLLECTION_NAME_MAX = 64
export const COLLECTIONS_LIMIT = 100
export const COLLECTION_ITEMS_LIMIT = 1000

export function normalizeCollectionName(value) {
  if (typeof value !== 'string') return null
  const name = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!name || name.length > COLLECTION_NAME_MAX) return null
  return name
}

export function parseCollectionId(value) {
  const id = typeof value === 'number' ? value : /^\d{1,12}$/.test(String(value ?? '')) ? Number(value) : NaN
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function ownCollection(db, userId, collectionId) {
  return db
    .prepare('SELECT id, name, created_at, updated_at FROM collections WHERE id = ? AND user_id = ?')
    .get(collectionId, userId)
}

function touch(db, collectionId) {
  db.prepare('UPDATE collections SET updated_at = ? WHERE id = ?').run(Date.now(), collectionId)
}

export function listCollections(userId) {
  return getDb()
    .prepare(
      `SELECT collections.id, collections.name, collections.created_at, collections.updated_at,
         (SELECT COUNT(*) FROM collection_items WHERE collection_id = collections.id) AS count
       FROM collections WHERE user_id = ? ORDER BY updated_at DESC`,
    )
    .all(userId)
}

export function getCollectionItems(userId, collectionId) {
  const db = getDb()
  const collection = ownCollection(db, userId, collectionId)
  if (!collection) return null
  const items = db
    .prepare(
      `SELECT collection_items.project_id, collection_items.created_at,
         projects.slug, projects.project_type, projects.title, projects.icon_url
       FROM collection_items JOIN projects ON projects.id = collection_items.project_id
       WHERE collection_items.collection_id = ? ORDER BY collection_items.created_at DESC`,
    )
    .all(collectionId)
  return { ...collection, items }
}

export function getProjectCollections(userId, projectId) {
  return getDb()
    .prepare(
      `SELECT collections.id, collections.name,
         EXISTS (SELECT 1 FROM collection_items WHERE collection_id = collections.id AND project_id = ?) AS has
       FROM collections WHERE user_id = ? ORDER BY updated_at DESC`,
    )
    .all(projectId, userId)
    .map((row) => ({ id: row.id, name: row.name, has: Boolean(row.has) }))
}

export function createCollection(userId, name) {
  const db = getDb()
  const total = db.prepare('SELECT COUNT(*) AS n FROM collections WHERE user_id = ?').get(userId).n
  if (total >= COLLECTIONS_LIMIT) return { error: 'limit' }
  const now = Date.now()
  const { lastInsertRowid } = db
    .prepare('INSERT INTO collections (user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)')
    .run(userId, name, now, now)
  return { id: Number(lastInsertRowid) }
}

export function renameCollection(userId, collectionId, name) {
  const { changes } = getDb()
    .prepare('UPDATE collections SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(name, Date.now(), collectionId, userId)
  return changes > 0
}

export function deleteCollection(userId, collectionId) {
  return getDb().prepare('DELETE FROM collections WHERE id = ? AND user_id = ?').run(collectionId, userId).changes > 0
}

export function setCollectionItem(userId, collectionId, projectId, on) {
  const db = getDb()
  if (!ownCollection(db, userId, collectionId)) return { error: 'not_found' }
  if (on) {
    const total = db.prepare('SELECT COUNT(*) AS n FROM collection_items WHERE collection_id = ?').get(collectionId).n
    if (total >= COLLECTION_ITEMS_LIMIT) return { error: 'limit' }
    db.prepare('INSERT OR IGNORE INTO collection_items (collection_id, project_id, created_at) VALUES (?, ?, ?)').run(
      collectionId,
      projectId,
      Date.now(),
    )
  } else {
    db.prepare('DELETE FROM collection_items WHERE collection_id = ? AND project_id = ?').run(collectionId, projectId)
  }
  touch(db, collectionId)
  return { ok: true }
}
