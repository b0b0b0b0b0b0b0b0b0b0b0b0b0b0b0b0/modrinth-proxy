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
    if (loader === 'minecraft' || seen.has(loader)) continue
    seen.add(loader)
    ids.push(loader)
  }

  const projectTypes = Array.isArray(version?.project_types) ? version.project_types : []
  const hasResourcePackType = projectTypes.includes('resourcepack')
  const hasResourcePackFile = Array.isArray(version?.files)
    && version.files.some((file) => file?.file_type === 'required-resource-pack')

  if ((hasResourcePackType || hasResourcePackFile) && !seen.has('resourcepack')) {
    seen.add('resourcepack')
    ids.push('resourcepack')
  }

  return ids
}

export function buildAllowedLoaderIds(contentType) {
  const config = getFilterConfig(normalizeFilterConfigKey(contentType))
  const ids = new Set()
  config.loaders?.forEach((loader) => ids.add(loader.id))
  config.platforms?.forEach((platform) => ids.add(platform.id))
  return ids
}

export function buildProjectAllowedLoaderIds(project, contentType) {
  const contentTypeIds = buildAllowedLoaderIds(contentType)
  const projectLoaders = Array.isArray(project?.loaders)
    ? project.loaders.filter(Boolean)
    : []

  if (projectLoaders.length === 0) return contentTypeIds

  const allowed = new Set(contentTypeIds)
  for (const loader of projectLoaders) {
    allowed.add(loader)
  }
  return allowed
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
