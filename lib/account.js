import { getDb } from './db'
import { getMod, getServer, isCourierData, MODRINTH_API, modrinthRequestHeaders } from './modrinth'
import { isProjectAccessDenied } from './contentFilter'
import { compareMinecraftVersionsDesc } from './minecraftVersionSort'
import { noteProjects, queueUserIfUnsent } from './versionWatch'
import { PROFILE_MOD_LOADER_IDS, PROFILE_SERVER_CORE_IDS } from './loaders'

const DAY_MS = 24 * 60 * 60 * 1000
const PROJECT_ID_RE = /^[A-Za-z0-9]{6,12}$/
const VARIANT_RE = /^[A-Za-z0-9_.,|+ -]{0,160}$/
const DOWNLOAD_URL_RE =
  /^https:\/\/cdn\.modrinth\.com\/data\/([A-Za-z0-9]{6,12})\/versions\/([A-Za-z0-9]{6,12})\/([^/?#]{1,200})/
const DOWNLOAD_DEDUPE_MS = 60 * 1000
const DOWNLOADS_PAGE_SIZE = 20
export const HISTORY_RETENTION_DAYS = 30
const INSTALL_RETENTION_DAYS = 180
const PURGE_INTERVAL_MS = 60 * 60 * 1000
const INSTALL_CHECK_LIMIT = 100
const FAVORITE_CHECK_LIMIT = 200
const FAVORITE_COUNTS_LIMIT = 100
const FAVORITE_BATCH_LOOKBACK = 60
const BATCH_GAP_MS = 15 * 60 * 1000
const CHECK_CONCURRENCY = 10
const BULK_CHUNK = 200
const UPDATES_REVALIDATE_S = 600
const VERSION_REVALIDATE_S = 24 * 60 * 60
const SHARE_PREFIX = 'mpfav1'
const SHARE_LIMIT = 200
const SHARE_CODE_MAX = 4000
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
  if (!project?.id || project.id !== projectId || isCourierData(project)) return null
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
  const db = getDb()
  const favorites = db.prepare('SELECT COUNT(*) AS n FROM favorites WHERE project_id = ?').get(projectId).n
  if (!userId) return { favorite: false, favorites, signedIn: false }
  const favorite = Boolean(
    db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND project_id = ?').get(userId, projectId),
  )
  return { favorite, favorites, signedIn: true }
}

export function getFavoriteCounts(projectIds) {
  const ids = [...new Set(projectIds.filter(isProjectId))].slice(0, FAVORITE_COUNTS_LIMIT)
  if (ids.length === 0) return {}
  const rows = getDb()
    .prepare(
      `SELECT project_id, COUNT(*) AS n FROM favorites WHERE project_id IN (${ids.map(() => '?').join(', ')}) GROUP BY project_id`,
    )
    .all(...ids)
  return Object.fromEntries(rows.map((row) => [row.project_id, row.n]))
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

export function getNotifyMutes(userId) {
  return new Set(
    getDb()
      .prepare('SELECT project_id FROM notify_mutes WHERE user_id = ?')
      .all(userId)
      .map((row) => row.project_id),
  )
}

export function setNotifyMute(userId, projectId, muted) {
  const db = getDb()
  if (muted) {
    db.prepare('INSERT OR IGNORE INTO notify_mutes (user_id, project_id, created_at) VALUES (?, ?, ?)').run(
      userId,
      projectId,
      Date.now(),
    )
  } else {
    db.prepare('DELETE FROM notify_mutes WHERE user_id = ? AND project_id = ?').run(userId, projectId)
  }
}

export function clearDownloadHistory(userId) {
  const db = getDb()
  return db.transaction(() => {
    const removed = db.prepare('DELETE FROM download_history WHERE user_id = ?').run(userId).changes
    db.prepare('DELETE FROM installs WHERE user_id = ?').run(userId)
    return removed
  })()
}

const PREFERENCE_COLUMNS = {
  trackDownloads: 'skip_download_updates',
  recordHistory: 'record_history',
  newsBadge: 'hide_news_badge',
  festive: 'hide_festive',
  ownServer: 'own_server',
}
const INVERTED_PREFERENCES = new Set(['trackDownloads', 'newsBadge', 'festive'])

export function setAccountPreference(userId, key, value) {
  if (!Object.hasOwn(PREFERENCE_COLUMNS, key) || typeof value !== 'boolean') return
  const stored = INVERTED_PREFERENCES.has(key) ? !value : value
  getDb().prepare(`UPDATE users SET ${PREFERENCE_COLUMNS[key]} = ? WHERE id = ?`).run(stored ? 1 : 0, userId)
}

const GAME_PROFILE_COLUMNS = {
  loader: 'game_loader',
  gameVersion: 'game_version',
  serverCore: 'server_core',
  serverVersion: 'server_version',
}

export function setGameProfile(userId, changes) {
  const db = getDb()
  for (const [key, column] of Object.entries(GAME_PROFILE_COLUMNS)) {
    if (changes[key] !== undefined) db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(changes[key] || null, userId)
  }
  if (changes.serverCore || changes.serverVersion) db.prepare('UPDATE users SET own_server = 1 WHERE id = ?').run(userId)
}

export function clearNotifyMutes(userId) {
  getDb().prepare('DELETE FROM notify_mutes WHERE user_id = ?').run(userId)
}

export function clearFavorites(userId) {
  return getDb().prepare('DELETE FROM favorites WHERE user_id = ?').run(userId).changes
}

export function buildFavoritesCode(projectIds) {
  return [SHARE_PREFIX, ...[...new Set(projectIds.filter(isProjectId))].sort().slice(0, SHARE_LIMIT)].join('.')
}

export function parseFavoritesCode(code) {
  if (typeof code !== 'string' || code.length > SHARE_CODE_MAX) return null
  const [prefix, ...ids] = code.replace(/\s+/g, '').split('.')
  if (prefix !== SHARE_PREFIX || ids.length === 0 || ids.length > SHARE_LIMIT) return null
  if (!ids.every(isProjectId)) return null
  return [...new Set(ids)]
}

export async function importFavorites(userId, projectIds) {
  const owned = new Set(
    getDb()
      .prepare('SELECT project_id FROM favorites WHERE user_id = ?')
      .all(userId)
      .map((row) => row.project_id),
  )
  const fresh = projectIds.filter((id) => !owned.has(id))
  let added = 0
  for (let i = 0; i < fresh.length; i += CHECK_CONCURRENCY) {
    const batch = fresh.slice(i, i + CHECK_CONCURRENCY)
    const projects = await Promise.all(batch.map((id) => rememberProject(id).catch(() => null)))
    projects.forEach((project, index) => {
      if (!project) return
      setFavorite(userId, batch[index], true)
      added += 1
    })
  }
  return { added, existing: projectIds.length - fresh.length, missing: fresh.length - added }
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

export function getDownloadsPage(userId, page, type = null) {
  const db = getDb()
  purgeExpired(db, Date.now())
  const byType = Object.fromEntries(
    db
      .prepare(
        `SELECT projects.project_type AS type, COUNT(*) AS n
         FROM download_history JOIN projects ON projects.id = download_history.project_id
         WHERE download_history.user_id = ? GROUP BY projects.project_type`,
      )
      .all(userId)
      .map((row) => [row.type, row.n]),
  )
  const all = Object.values(byType).reduce((sum, n) => sum + n, 0)
  const filter = type ? 'AND projects.project_type = ?' : ''
  const params = type ? [userId, type] : [userId]
  const total = type ? byType[type] || 0 : all
  const pages = Math.max(1, Math.ceil(total / DOWNLOADS_PAGE_SIZE))
  const current = Math.min(pages, Math.max(1, Number.isInteger(page) ? page : 1))
  const rows = db
    .prepare(
      `SELECT download_history.id, download_history.project_id, download_history.file_name,
         download_history.created_at, ${PROJECT_COLUMNS}
       FROM download_history JOIN projects ON projects.id = download_history.project_id
       WHERE download_history.user_id = ? ${filter}
       ORDER BY download_history.created_at DESC, download_history.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, DOWNLOADS_PAGE_SIZE, (current - 1) * DOWNLOADS_PAGE_SIZE)
  return { rows, total, all, byType, pages, page: current }
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

function isNewerInstallVersion(row, version) {
  return Boolean(
    version?.id &&
      version.id !== row.version_id &&
      publishedAt(version) > row.published_at &&
      channelRank(version.version_type) <= channelRank(row.version_type) &&
      String(version.version_number || '') !== row.version_number,
  )
}

async function checkInstall(row, dismissed) {
  const loaders = parseLoaders(row.loaders)
  const params = new URLSearchParams()
  if (loaders.length) params.set('loaders', JSON.stringify(loaders))
  if (row.game_version) params.set('game_versions', JSON.stringify([row.game_version]))

  const candidates = await fetchList(`${MODRINTH_API}/project/${row.project_id}/version?${params}`)
  const latest = candidates
    .filter((version) => isNewerInstallVersion(row, version))
    .reduce((best, version) => (publishedAt(version) > publishedAt(best) ? version : best), null)

  return installUpdate(row, latest, dismissed)
}

function installUpdate(row, latest, dismissed) {
  if (!latest) return null
  if (dismissed.get(dismissalKey(row.project_id, row.variant)) === latest.id) return null

  const loaders = parseLoaders(row.loaders)
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

async function getInstallUpdates(userId, dismissed, covered, muted) {
  const rows = getDb()
    .prepare(
      `SELECT installs.project_id, installs.variant, installs.version_id, installs.version_number,
         installs.version_type, installs.loaders, installs.game_version, installs.published_at, ${PROJECT_COLUMNS}
       FROM installs JOIN projects ON projects.id = installs.project_id
       WHERE installs.user_id = ? AND installs.downloaded_at > ?
       ORDER BY installs.downloaded_at DESC LIMIT ?`,
    )
    .all(userId, Date.now() - INSTALL_RETENTION_DAYS * DAY_MS, INSTALL_CHECK_LIMIT)
    .filter((row) => !muted.has(row.project_id))

  for (const row of rows) covered.add(row.project_id)
  if (rows.length === 0) return []

  const installed = await fetchBulk('versions', [...new Set(rows.map((row) => row.version_id))])
  if (installed.length === 0) return []
  const sha1ById = new Map()
  for (const version of installed) {
    const files = Array.isArray(version?.files) ? version.files : []
    const sha1 = (files.find((file) => file?.primary) || files[0])?.hashes?.sha1
    if (version?.id && sha1) sha1ById.set(version.id, sha1)
  }

  const groups = new Map()
  const leftovers = []
  for (const row of rows) {
    const sha1 = sha1ById.get(row.version_id)
    if (!sha1) {
      leftovers.push(row)
      continue
    }
    const key = `${row.loaders}|${row.game_version}|${channelRank(row.version_type)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ row, sha1 })
  }

  const updates = []
  for (const group of groups.values()) {
    const { row: sample } = group[0]
    const latestByHash = await fetchLatestByHashes(
      group.map((item) => item.sha1),
      parseLoaders(sample.loaders),
      sample.game_version,
      channelRank(sample.version_type),
    )
    if (!latestByHash) continue
    for (const { row, sha1 } of group) {
      const latest = latestByHash[sha1]
      updates.push(installUpdate(row, isNewerInstallVersion(row, latest) ? latest : null, dismissed))
    }
  }

  for (let i = 0; i < leftovers.length; i += CHECK_CONCURRENCY) {
    const batch = leftovers.slice(i, i + CHECK_CONCURRENCY)
    updates.push(...(await Promise.all(batch.map((row) => checkInstall(row, dismissed)))))
  }
  return updates.filter(Boolean)
}

async function fetchLatestByHashes(hashes, loaders, gameVersion, maxRank) {
  const body = {
    hashes,
    algorithm: 'sha1',
    version_types: Object.keys(CHANNEL_RANK).filter((type) => CHANNEL_RANK[type] <= maxRank),
  }
  if (loaders.length) body.loaders = loaders
  if (gameVersion) body.game_versions = [gameVersion]
  try {
    const response = await fetch(`${MODRINTH_API}/version_files/update`, {
      method: 'POST',
      headers: { ...modrinthRequestHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!response.ok) return null
    const data = await response.json()
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

const MOD_LOADERS = new Set(PROFILE_MOD_LOADER_IDS)
const GAME_LOADERS = PROFILE_MOD_LOADER_IDS
const PLUGIN_LOADERS = new Set(PROFILE_SERVER_CORE_IDS)
const SERVER_CORES = PROFILE_SERVER_CORE_IDS
const RUNS = {
  quilt: ['quilt', 'fabric'],
  purpur: ['purpur', 'paper', 'spigot', 'bukkit'],
  paper: ['paper', 'spigot', 'bukkit'],
  spigot: ['spigot', 'bukkit'],
  bungeecord: ['bungeecord', 'waterfall'],
  waterfall: ['waterfall', 'bungeecord'],
}

export function isServerCore(value) {
  return SERVER_CORES.includes(value)
}
const GAME_VERSION_RE = /^[0-9a-z][0-9a-z.\-+]{0,31}$/i

export function isGameLoader(value) {
  return GAME_LOADERS.includes(value)
}

export function isGameVersion(value) {
  return typeof value === 'string' && GAME_VERSION_RE.test(value)
}

function guessGameProfile(userId) {
  const rows = getDb()
    .prepare('SELECT loaders, game_version FROM installs WHERE user_id = ? ORDER BY downloaded_at DESC LIMIT ?')
    .all(userId, INSTALL_CHECK_LIMIT)
  const counts = { loader: new Map(), gameVersion: new Map(), serverCore: new Map(), serverVersion: new Map() }
  const bump = (map, key) => key && map.set(key, (map.get(key) || 0) + 1)
  for (const row of rows) {
    const loaders = parseLoaders(row.loaders)
    const cores = loaders.filter((loader) => SERVER_CORES.includes(loader))
    for (const loader of loaders) if (MOD_LOADERS.has(loader)) bump(counts.loader, loader)
    for (const loader of cores) bump(counts.serverCore, loader)
    if (loaders.some((loader) => PLUGIN_LOADERS.has(loader))) bump(counts.serverVersion, row.game_version)
    else bump(counts.gameVersion, row.game_version)
  }
  const top = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null
  return {
    loader: top(counts.loader),
    gameVersion: top(counts.gameVersion),
    serverCore: top(counts.serverCore),
    serverVersion: top(counts.serverVersion),
  }
}

export function getGameProfile(userId) {
  const user =
    getDb().prepare('SELECT game_loader, game_version, server_core, server_version, own_server FROM users WHERE id = ?').get(userId) || {}
  const guess = guessGameProfile(userId)
  const chosen = {
    loader: isGameLoader(user.game_loader) ? user.game_loader : null,
    gameVersion: isGameVersion(user.game_version) ? user.game_version : null,
    serverCore: isServerCore(user.server_core) ? user.server_core : null,
    serverVersion: isGameVersion(user.server_version) ? user.server_version : null,
  }
  const ownServer =
    user.own_server == null ? Boolean(chosen.serverCore || chosen.serverVersion || guess.serverCore) : Boolean(user.own_server)
  if (!ownServer) {
    guess.serverCore = null
    guess.serverVersion = null
  }
  return {
    ownServer,
    loader: chosen.loader || guess.loader,
    gameVersion: chosen.gameVersion || guess.gameVersion,
    serverCore: chosen.serverCore || guess.serverCore,
    serverVersion: chosen.serverVersion || guess.serverVersion,
    chosen,
    guess,
  }
}

function latestBatch(versions, since) {
  const sorted = versions.filter((version) => version?.id).sort((a, b) => publishedAt(b) - publishedAt(a))
  const batch = []
  for (const version of sorted) {
    if (publishedAt(version) <= since) break
    const previous = batch[batch.length - 1]
    if (previous && publishedAt(previous) - publishedAt(version) > BATCH_GAP_MS) break
    batch.push(version)
  }
  return batch
}

function versionKind(version) {
  const loaders = versionLoaders(version)
  if (loaders.some((loader) => MOD_LOADERS.has(loader))) return 'mod'
  if (loaders.some((loader) => PLUGIN_LOADERS.has(loader))) return 'plugin'
  return 'other'
}

function wantedFor(kind, profile) {
  if (kind === 'mod') return { loader: profile.loader, gameVersion: profile.gameVersion }
  if (kind === 'plugin') return { loader: profile.serverCore, gameVersion: profile.serverVersion }
  return { loader: null, gameVersion: profile.gameVersion || profile.serverVersion }
}

function hasWanted(wanted) {
  return Boolean(wanted.loader || wanted.gameVersion)
}

function matchesProfile(version, profile) {
  const wanted = wantedFor(versionKind(version), profile)
  if (!hasWanted(wanted)) return false
  if (wanted.loader) {
    const accepted = RUNS[wanted.loader] || [wanted.loader]
    if (!versionLoaders(version).some((loader) => accepted.includes(loader))) return false
  }
  const games = Array.isArray(version.game_versions) ? version.game_versions.map(String) : []
  return !wanted.gameVersion || games.length === 0 || games.includes(wanted.gameVersion)
}

function bestVersion(versions) {
  return versions.reduce((best, version) => {
    if (!best) return version
    const rank = channelRank(version.version_type) - channelRank(best.version_type)
    if (rank !== 0) return rank < 0 ? version : best
    return publishedAt(version) > publishedAt(best) ? version : best
  }, null)
}

function commonLabel(names) {
  let prefix = names[0] || ''
  for (const name of names) {
    while (prefix && !name.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  prefix = prefix.replace(/[-_.+\s]+$/, '')
  return /\d/.test(prefix) && prefix.length >= 3 ? prefix : ''
}

function gameRange(versions) {
  const list = [...new Set(versions)].sort(compareMinecraftVersionsDesc)
  if (list.length <= 3) return list.join(', ')
  return `${list[list.length - 1]}–${list[0]}`
}

async function getFavoriteUpdates(userId, covered, dismissedVersions) {
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
  noteProjects(projects)
  const projectById = new Map(projects.filter((project) => project?.id).map((project) => [project.id, project]))
  const changed = rows.filter((row) => {
    const project = projectById.get(row.project_id)
    return project && Date.parse(project.updated || '') > row.seen_at && Array.isArray(project.versions)
  })
  if (changed.length === 0) return []

  const recentIds = changed.flatMap((row) => projectById.get(row.project_id).versions.slice(-FAVORITE_BATCH_LOOKBACK))
  const versionsByProject = new Map()
  for (const version of await fetchBulk('versions', recentIds)) {
    if (!version?.project_id) continue
    const list = versionsByProject.get(version.project_id) || []
    list.push(version)
    versionsByProject.set(version.project_id, list)
  }

  const profile = getGameProfile(userId)
  const personal = Boolean(profile.loader || profile.gameVersion || profile.serverCore || profile.serverVersion)
  const updates = []
  for (const row of changed) {
    const recent = versionsByProject.get(row.project_id) || []
    const batch = latestBatch(recent, row.seen_at)
    if (batch.length === 0) continue

    const base = {
      kind: 'favorite',
      project_id: row.project_id,
      variant: '',
      slug: row.slug,
      project_type: row.project_type,
      title: row.title,
      icon_url: row.icon_url,
      from_version: null,
    }

    if (personal) {
      const match = bestVersion(
        recent.filter((version) => publishedAt(version) > row.seen_at && matchesProfile(version, profile)),
      )
      if (!match) continue
      if (dismissedVersions.has(`${row.project_id}:${match.id}`)) continue
      const games = Array.isArray(match.game_versions) ? match.game_versions.map(String) : []
      const wanted = wantedFor(versionKind(match), profile)
      updates.push({
        ...base,
        version_id: match.id,
        version_number: String(match.version_number || ''),
        version_type: String(match.version_type || 'release'),
        game_version: wanted.gameVersion && games.includes(wanted.gameVersion) ? wanted.gameVersion : topGameVersion(match),
        loaders: versionLoaders(match).filter((loader) => loader !== 'minecraft'),
        file: primaryFile(match),
        created_at: publishedAt(match),
      })
      continue
    }

    const newest = batch[0]
    if (dismissedVersions.has(`${row.project_id}:${newest.id}`)) continue
    updates.push({
      ...base,
      version_id: newest.id,
      version_number: batch.length === 1 ? String(newest.version_number || '') : commonLabel(batch.map((v) => String(v.version_number || ''))),
      version_type: String(bestVersion(batch).version_type || 'release'),
      game_version: gameRange(batch.flatMap((version) => (Array.isArray(version.game_versions) ? version.game_versions.map(String) : []))),
      loaders: [...new Set(batch.flatMap(versionLoaders))].filter((loader) => loader !== 'minecraft'),
      file: null,
      created_at: publishedAt(newest),
    })
  }
  return updates
}

export async function getUpdates(userId, { fromBot = false } = {}) {
  const dismissals = getDb()
    .prepare('SELECT project_id, variant, version_id FROM update_dismissals WHERE user_id = ?')
    .all(userId)
  const dismissed = new Map(dismissals.map((row) => [dismissalKey(row.project_id, row.variant), row.version_id]))
  const dismissedVersions = new Set(dismissals.map((row) => `${row.project_id}:${row.version_id}`))
  const covered = new Set()
  const skipDownloads = Boolean(
    getDb().prepare('SELECT skip_download_updates FROM users WHERE id = ?').get(userId)?.skip_download_updates,
  )
  const fromInstalls = skipDownloads ? [] : await getInstallUpdates(userId, dismissed, covered, getNotifyMutes(userId))
  const fromFavorites = await getFavoriteUpdates(userId, covered, dismissedVersions)
  const updates = [...fromInstalls, ...fromFavorites].sort((a, b) => b.created_at - a.created_at)
  if (!fromBot) queueUserIfUnsent(userId, updates)
  return updates
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
