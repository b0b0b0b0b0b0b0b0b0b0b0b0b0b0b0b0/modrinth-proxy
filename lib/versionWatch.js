import { getDb } from './db'
import { versionsStamp } from './modrinth'

const QUEUE_SQL = `UPDATE users SET telegram_checked_at = 0
  WHERE telegram_id IS NOT NULL AND telegram_notify = 1 AND telegram_checked_at != 0 AND id IN (
    SELECT user_id FROM favorites WHERE project_id = ?
    UNION SELECT user_id FROM installs WHERE project_id = ?
  )`

export function noteProjectStamp(projectId, stamp) {
  if (typeof projectId !== 'string' || !projectId || !stamp) return
  try {
    const db = getDb()
    const row = db.prepare('SELECT stamp FROM project_stamps WHERE project_id = ?').get(projectId)
    if (row?.stamp === stamp) return
    db.prepare(
      `INSERT INTO project_stamps (project_id, stamp) VALUES (?, ?)
       ON CONFLICT(project_id) DO UPDATE SET stamp = excluded.stamp`,
    ).run(projectId, stamp)
    db.prepare(QUEUE_SQL).run(projectId, projectId)
  } catch {}
}

export function noteProjects(projects) {
  for (const project of projects) {
    if (project?.id) noteProjectStamp(project.id, versionsStamp(project))
  }
}

export function unsentUpdates(db, userId, updates) {
  const rows = db.prepare('SELECT project_id, variant, version_id FROM update_notifications WHERE user_id = ?').all(userId)
  const sent = new Map(rows.map((row) => [`${row.project_id}:${row.variant}`, row.version_id]))
  const sentVersions = new Set(rows.map((row) => `${row.project_id}:${row.version_id}`))
  return updates.filter(
    (item) =>
      sent.get(`${item.project_id}:${item.variant}`) !== item.version_id &&
      !sentVersions.has(`${item.project_id}:${item.version_id}`),
  )
}

export function queueUserIfUnsent(userId, updates) {
  if (!updates.length) return
  try {
    const db = getDb()
    const user = db
      .prepare('SELECT telegram_id, telegram_notify, telegram_checked_at FROM users WHERE id = ?')
      .get(userId)
    if (!user?.telegram_id || !user.telegram_notify || user.telegram_checked_at === 0) return
    if (unsentUpdates(db, userId, updates).length > 0) {
      db.prepare('UPDATE users SET telegram_checked_at = 0 WHERE id = ?').run(userId)
    }
  } catch {}
}
