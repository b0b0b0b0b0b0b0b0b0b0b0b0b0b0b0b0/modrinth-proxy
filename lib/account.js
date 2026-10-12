import { getDb } from './db'
import { getMod, getServer, MODRINTH_API, modrinthRequestHeaders } from './modrinth'
import { isProjectAccessDenied } from './contentFilter'
import { compareMinecraftVersionsDesc } from './minecraftVersionSort'

const DAY_MS = 24 * 60 * 60 * 1000
const PROJECT_ID_RE = /^[A-Za-z0-9]{6,12}$/
const VARIANT_RE = /^[A-Za-z0-9_.,|+ -]{0,160}$/
const DOWNLOAD_URL_RE =
  /^https:\/\/cdn\.modrinth\.com\/data\/([A-Za-z0-9]{6,12})\/versions\/([A-Za-z0-9]{6,12})\/([^/?#]{1,200})/
const DOWNLOAD_DEDUPE_MS = 60 * 1000
const DOWNLOADS_PAGE_SIZE = 20
export const HISTORY_RETENTION_DAYS = 30
const INSTALL_RETENTION_DAYS = 180
const EMPTY_ACCOUNT_DAYS = 30
const PURGE_INTERVAL_MS = 60 * 60 * 1000
const INSTALL_CHECK_LIMIT = 100
const FAVORITE_CHECK_LIMIT = 200
const FAVORITE_RECENT_VERSIONS = 5
const CHECK_CONCURRENCY = 10
const BULK_CHUNK = 200
const UPDATES_REVALIDATE_S = 600
const VERSION_REVALIDATE_S = 24 * 60 * 60
const SERVER_TYPE = 'minecraft_java_server'
const CHANNEL_RANK = { release: 0, beta: 1, alpha: 2 }
const PROJECT_COLUMNS = 'projects.slug, projects.project_type, projects.title, projects.icon_url'

export function isProjectId(id) {
  return typeof id === 'string' && PROJECT_ID_RE.test(id)
}

export function isVariant(value) {
  return typeof value === 'string' && VARIANT_RE.test(value)
}

export function parseDownloadUrl(url) {
  const match = typeof url === 'string' ? DOWNLOAD_URL_RE.exec(url) : null
  if (!match) return null
  let fileName = match[3]
  try {
    fileName = decodeURIComponent(fileName)
  } catch {}
  return { projectId: match[1], versionId: match[2], fileName }
}

export async function rememberProject(projectId) {
  if (!isProjectId(projectId)) return null
  const project = await getMod(projectId).catch(() => getServer(projectId).catch(() => null))
  if (!project?.id || project.id !== projectId) return null
  if (await isProjectAccessDenied(project.slug, project)) return null

  getDb()
    .prepare(
      `INSERT INTO projects (id, slug, project_type, title, icon_url, updated_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, project_type = excluded.project_type,
         title = excluded.title, icon_url = excluded.icon_url, updated_at = excluded.updated_at`,
    )
    .run(
      project.id,
      String(project.slug || project.id),
      String(project.project_type || 'mod'),
      String(project.title || project.slug || project.id),
      project.icon_url || null,
      Date.now(),
    )
  return project
}

export function getProjectState(userId, projectId) {
  if (!userId) return { favorite: false, signedIn: false }
  const favorite = Boolean(
    getDb().prepare('SELECT 1 FROM favorites WHERE user_id = ? AND project_id = ?').get(userId, projectId),
  )
  return { favorite, signedIn: true }
}

export function setFavorite(userId, projectId, on) {
  const db = getDb()
  if (on) {
    const now = Date.now()
    db.prepare(
      'INSERT OR IGNORE INTO favorites (user_id, project_id, created_at, seen_at) VALUES (?, ?, ?, ?)',
    ).run(userId, projectId, now, now)
  } else {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND project_id = ?').run(userId, projectId)
  }
}

async function fetchJson(url, revalidate) {
  try {
    const response = await fetch(url, {
      headers: modrinthRequestHeaders(),
      signal: AbortSignal.timeout(15000),
      next: { revalidate },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function fetchList(url) {
  const data = await fetchJson(url, UPDATES_REVALIDATE_S)
  return Array.isArray(data) ? data : []
}

async function fetchBulk(path, ids) {
  const result = []
  for (let i = 0; i < ids.length; i += BULK_CHUNK) {
    const chunk = ids.slice(i, i + BULK_CHUNK)
    result.push(
      ...(await fetchList(`${MODRINTH_API}/${path}?ids=${encodeURIComponent(JSON.stringify(chunk))}`)),
    )
  }
  return result
}

function publishedAt(version) {
  const time = Date.parse(version?.date_published)
  return Number.isFinite(time) ? time : 0
}

function channelRank(type) {
  return CHANNEL_RANK[String(type || 'release').toLowerCase()] ?? CHANNEL_RANK.release
}

function versionLoaders(version) {
  return (Array.isArray(version?.loaders) ? version.loaders : []).map(String).sort()
}

function topGameVersion(version) {
  const versions = Array.isArray(version?.game_versions) ? version.game_versions.map(String) : []
  return versions.length ? [...versions].sort(compareMinecraftVersionsDesc)[0] : ''
}

function primaryFile(version) {
  const files = Array.isArray(version?.files) ? version.files : []
  const file = files.find((item) => item?.primary) || files[0]
  if (!file?.url || !parseDownloadUrl(file.url)) return null
  return { url: file.url, filename: String(file.filename || ''), size: Number(file.size) || 0 }
}

function purgeExpired(db, now) {
  if (now - (globalThis.__accountPurgedAt || 0) < PURGE_INTERVAL_MS) return
  globalThis.__accountPurgedAt = now
  db.prepare('DELETE FROM download_history WHERE created_at < ?').run(now - HISTORY_RETENTION_DAYS * DAY_MS)
  db.prepare('DELETE FROM installs WHERE downloaded_at < ?').run(now - INSTALL_RETENTION_DAYS * DAY_MS)
  db.prepare(
    `DELETE FROM users WHERE created_at < ?
       AND NOT EXISTS (SELECT 1 FROM favorites WHERE favorites.user_id = users.id)
       AND NOT EXISTS (SELECT 1 FROM installs WHERE installs.user_id = users.id)
       AND NOT EXISTS (SELECT 1 FROM download_history WHERE download_history.user_id = users.id)`,
  ).run(now - EMPTY_ACCOUNT_DAYS * DAY_MS)
}

export async function addDownload(userId, { projectId, versionId, fileName }) {
  const version = await fetchJson(`${MODRINTH_API}/version/${versionId}`, VERSION_REVALIDATE_S)
  if (!version?.id || version.project_id !== projectId) return false

  const db = getDb()
  const now = Date.now()
  purgeExpired(db, now)

  const recent = db
    .prepare(
      'SELECT 1 FROM download_history WHERE user_id = ? AND version_id = ? AND file_name = ? AND created_at > ?',
    )
    .get(userId, versionId, fileName, now - DOWNLOAD_DEDUPE_MS)
  if (!recent) {
    db.prepare(
      'INSERT INTO download_history (user_id, project_id, version_id, file_name, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(userId, projectId, versionId, fileName, now)
  }

  const loaders = versionLoaders(version)
  const gameVersion = topGameVersion(version)
  const variant = `${loaders.join(',')}|${gameVersion}`
  if (!isVariant(variant)) return true

  db.prepare(
    `INSERT INTO installs
       (user_id, project_id, variant, version_id, version_number, version_type, loaders, game_version, published_at, downloaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, project_id, variant) DO UPDATE SET
       version_id = excluded.version_id, version_number = excluded.version_number,
       version_type = excluded.version_type, published_at = excluded.published_at,
       downloaded_at = excluded.downloaded_at`,
  ).run(
    userId,
    projectId,
    variant,
    version.id,
    String(version.version_number || ''),
    String(version.version_type || 'release'),
    JSON.stringify(loaders),
    gameVersion,
    publishedAt(version),
    now,
  )
  db.prepare('DELETE FROM update_dismissals WHERE user_id = ? AND project_id = ? AND variant = ?').run(
    userId,
    projectId,
    variant,
  )
  return true
}

export function getFavorites(userId) {
  return getDb()
    .prepare(
      `SELECT favorites.project_id, favorites.created_at, ${PROJECT_COLUMNS}
       FROM favorites JOIN projects ON projects.id = favorites.project_id
       WHERE favorites.user_id = ? ORDER BY favorites.created_at DESC`,
    )
    .all(userId)
}

export function getDownloadsPage(userId, page) {
  const db = getDb()
  purgeExpired(db, Date.now())
  const total = db.prepare('SELECT COUNT(*) AS total FROM download_history WHERE user_id = ?').get(userId).total
  const pages = Math.max(1, Math.ceil(total / DOWNLOADS_PAGE_SIZE))
  const current = Math.min(pages, Math.max(1, Number.isInteger(page) ? page : 1))
  const rows = db
    .prepare(
      `SELECT download_history.id, download_history.project_id, download_history.file_name,
         download_history.created_at, ${PROJECT_COLUMNS}
       FROM download_history JOIN projects ON projects.id = download_history.project_id
       WHERE download_history.user_id = ?
       ORDER BY download_history.created_at DESC, download_history.id DESC LIMIT ? OFFSET ?`,
    )
    .all(userId, DOWNLOADS_PAGE_SIZE, (current - 1) * DOWNLOADS_PAGE_SIZE)
  return { rows, total, pages, page: current }
}

function dismissalKey(projectId, variant) {
  return `${projectId}:${variant}`
}

function parseLoaders(value) {
  try {
    const loaders = JSON.parse(value)
    return Array.isArray(loaders) ? loaders.map(String) : []
  } catch {
    return []
  }
}

async function checkInstall(row, dismissed) {
  const loaders = parseLoaders(row.loaders)
  const params = new URLSearchParams()
  if (loaders.length) params.set('loaders', JSON.stringify(loaders))
  if (row.game_version) params.set('game_versions', JSON.stringify([row.game_version]))

  const candidates = await fetchList(`${MODRINTH_API}/project/${row.project_id}/version?${params}`)
  const allowedRank = channelRank(row.version_type)
  const latest = candidates
    .filter(
      (version) =>
        version?.id &&
        version.id !== row.version_id &&
        publishedAt(version) > row.published_at &&
        channelRank(version.version_type) <= allowedRank &&
        String(version.version_number || '') !== row.version_number,
    )
    .reduce((best, version) => (publishedAt(version) > publishedAt(best) ? version : best), null)

  if (!latest) return null
  if (dismissed.get(dismissalKey(row.project_id, row.variant)) === latest.id) return null

  const kept = new Set(versionLoaders(latest))
  return {
    kind: 'download',
    project_id: row.project_id,
    variant: row.variant,
    slug: row.slug,
    project_type: row.project_type,
    title: row.title,
    icon_url: row.icon_url,
    from_version: row.version_number,
    version_id: latest.id,
    version_number: String(latest.version_number || ''),
    version_type: String(latest.version_type || 'release'),
    game_version: row.game_version,
    loaders: loaders.filter((loader) => kept.has(loader) && loader !== 'minecraft'),
    file: primaryFile(latest),
    created_at: publishedAt(latest),
  }
}

async function getInstallUpdates(userId, dismissed, covered) {
  const rows = getDb()
    .prepare(
      `SELECT installs.project_id, installs.variant, installs.version_id, installs.version_number,
         installs.version_type, installs.loaders, installs.game_version, installs.published_at, ${PROJECT_COLUMNS}
       FROM installs JOIN projects ON projects.id = installs.project_id
       WHERE installs.user_id = ? AND installs.downloaded_at > ?
       ORDER BY installs.downloaded_at DESC LIMIT ?`,
    )
    .all(userId, Date.now() - INSTALL_RETENTION_DAYS * DAY_MS, INSTALL_CHECK_LIMIT)

  const updates = []
  for (let i = 0; i < rows.length; i += CHECK_CONCURRENCY) {
    const batch = rows.slice(i, i + CHECK_CONCURRENCY)
    for (const row of batch) covered.add(row.project_id)
    updates.push(...(await Promise.all(batch.map((row) => checkInstall(row, dismissed)))))
  }
  return updates.filter(Boolean)
}

async function getFavoriteUpdates(userId, dismissed, covered) {
  const rows = getDb()
    .prepare(
      `SELECT favorites.project_id, favorites.seen_at, ${PROJECT_COLUMNS}
       FROM favorites JOIN projects ON projects.id = favorites.project_id
       WHERE favorites.user_id = ? AND projects.project_type != ?
       ORDER BY favorites.created_at DESC LIMIT ?`,
    )
    .all(userId, SERVER_TYPE, FAVORITE_CHECK_LIMIT)
    .filter((row) => !covered.has(row.project_id))
  if (rows.length === 0) return []

  const projects = await fetchBulk('projects', rows.map((row) => row.project_id))
  const recentIds = []
  for (const project of projects) {
    if (Array.isArray(project?.versions)) recentIds.push(...project.versions.slice(-FAVORITE_RECENT_VERSIONS))
  }

  const versionsByProject = new Map()
  for (const version of await fetchBulk('versions', recentIds)) {
    if (!version?.project_id) continue
    const list = versionsByProject.get(version.project_id) || []
    list.push(version)
    versionsByProject.set(version.project_id, list)
  }

  const updates = []
  for (const row of rows) {
    const recent = versionsByProject.get(row.project_id) || []
    const stableRank = Math.min(...recent.map((version) => channelRank(version.version_type)))
    const latest = recent
      .filter(
        (version) =>
          publishedAt(version) > row.seen_at && channelRank(version.version_type) === stableRank,
      )
      .reduce((best, version) => (publishedAt(version) > publishedAt(best) ? version : best), null)
    if (!latest) continue
    if (dismissed.get(dismissalKey(row.project_id, '')) === latest.id) continue

    updates.push({
      kind: 'favorite',
      project_id: row.project_id,
      variant: '',
      slug: row.slug,
      project_type: row.project_type,
      title: row.title,
      icon_url: row.icon_url,
      from_version: null,
      version_id: latest.id,
      version_number: String(latest.version_number || ''),
      version_type: String(latest.version_type || 'release'),
      game_version: '',
      loaders: [],
      file: null,
      created_at: publishedAt(latest),
    })
  }
  return updates
}

export async function getUpdates(userId) {
  const dismissed = new Map(
    getDb()
      .prepare('SELECT project_id, variant, version_id FROM update_dismissals WHERE user_id = ?')
      .all(userId)
      .map((row) => [dismissalKey(row.project_id, row.variant), row.version_id]),
  )
  const covered = new Set()
  const fromInstalls = await getInstallUpdates(userId, dismissed, covered)
  const fromFavorites = await getFavoriteUpdates(userId, dismissed, covered)
  return [...fromInstalls, ...fromFavorites].sort((a, b) => b.created_at - a.created_at)
}

export async function dismissUpdates(userId, target = null) {
  const db = getDb()
  const dismiss = db.prepare(
    `INSERT INTO update_dismissals (user_id, project_id, variant, version_id) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, project_id, variant) DO UPDATE SET version_id = excluded.version_id`,
  )
  const now = Date.now()

  if (target) {
    dismiss.run(userId, target.projectId, target.variant, target.versionId)
    if (target.variant === '') {
      db.prepare('UPDATE favorites SET seen_at = ? WHERE user_id = ? AND project_id = ?').run(
        now,
        userId,
        target.projectId,
      )
    }
    return
  }

  const updates = await getUpdates(userId)
  db.transaction(() => {
    for (const update of updates) dismiss.run(userId, update.project_id, update.variant, update.version_id)
    db.prepare('UPDATE favorites SET seen_at = ? WHERE user_id = ?').run(now, userId)
  })()
}
