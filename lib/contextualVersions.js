import { getFilterConfig } from './filterConfig'

const FILTER_CONFIG_KEYS = {
  mod: 'mods',
  mods: 'mods',
  plugin: 'plugins',
  plugins: 'plugins',
  shader: 'shaders',
  shaders: 'shaders',
  modpack: 'modpacks',
  modpacks: 'modpacks',
  datapack: 'datapacks',
  datapacks: 'datapacks',
  resourcepack: 'resourcepacks',
  resourcepacks: 'resourcepacks',
}

export function normalizeFilterConfigKey(contentType) {
  const raw = String(contentType || 'mods').replace(/^discover\//, '')
  return FILTER_CONFIG_KEYS[raw] || raw
}

const PROJECT_PAGE_ROUTE_OVERRIDES = {
  minecraft_java_server: 'server',
}

export function normalizeContentRoute(contentType) {
  const raw = String(contentType || 'mods').replace(/^discover\//, '')
  if (PROJECT_PAGE_ROUTE_OVERRIDES[raw]) return PROJECT_PAGE_ROUTE_OVERRIDES[raw]
  return raw.replace(/s$/, '') || 'mod'
}

export function getVersionGameVersions(version) {
  return Array.isArray(version?.game_versions) ? version.game_versions : []
}

export function getVersionLoaders(version) {
  return Array.isArray(version?.loaders) ? version.loaders : []
}

export function getVersionPlatformIds(version) {
  const ids = []
  const seen = new Set()

  for (const loader of getVersionLoaders(version)) {
    if (seen.has(loader)) continue
    seen.add(loader)
    ids.push(loader)
  }

  const projectTypes = Array.isArray(version?.project_types) ? version.project_types : []
  const hasResourcePackType = projectTypes.includes('resourcepack')
  const hasResourcePackFile = Array.isArray(version?.files)
    && version.files.some((file) => file?.file_type === 'required-resource-pack')

  if ((hasResourcePackType || hasResourcePackFile) && !seen.has('minecraft')) {
    seen.add('minecraft')
    ids.push('minecraft')
  }

  return ids
}

export function listLoaderIdsForContentType(contentType) {
  const config = getFilterConfig(normalizeFilterConfigKey(contentType))
  const ids = []
  const seen = new Set()
  const add = (item) => {
    const id = typeof item === 'string' ? item : item?.id
    if (!id || seen.has(id)) return
    seen.add(id)
    ids.push(id)
  }
  config.loaders?.forEach(add)
  config.platforms?.forEach(add)
  return ids
}

export function orderLoaderIds(ids, contentType) {
  const present = new Set(Array.isArray(ids) ? ids.filter(Boolean) : [])
  const ordered = []
  const seen = new Set()
  for (const id of listLoaderIdsForContentType(contentType)) {
    if (!present.has(id) || seen.has(id)) continue
    seen.add(id)
    ordered.push(id)
  }
  for (const id of present) {
    if (seen.has(id)) continue
    seen.add(id)
    ordered.push(id)
  }
  return ordered
}

export function buildAllowedLoaderIds(contentType) {
  return new Set(listLoaderIdsForContentType(contentType))
}

export function buildProjectAllowedLoaderIds(project, contentType) {
  return buildAllowedLoaderIds(contentType)
}

export function filterLoadersForContentType(loaders, contentType) {
  const allowed = buildAllowedLoaderIds(contentType)
  const list = Array.isArray(loaders) ? loaders : []
  if (!allowed.size) return list
  return list.filter((loader) => allowed.has(loader))
}

export function versionMatchesLoaders(version, allowedLoaderIds) {
  if (!allowedLoaderIds?.size) return true
  return getVersionLoaders(version).some((loader) => allowedLoaderIds.has(loader))
}

export function filterVersionsByContentType(versions, contentType) {
  if (!Array.isArray(versions)) return []
  const allowedLoaderIds = buildAllowedLoaderIds(contentType)
  if (!allowedLoaderIds.size) return versions
  return versions.filter((version) => versionMatchesLoaders(version, allowedLoaderIds))
}

export function filterVersionsForProject(versions, project, contentType) {
  if (!Array.isArray(versions)) return []
  const allowedLoaderIds = buildProjectAllowedLoaderIds(project, contentType)
  if (!allowedLoaderIds.size) return versions
  return versions.filter((version) => versionMatchesLoaders(version, allowedLoaderIds))
}
