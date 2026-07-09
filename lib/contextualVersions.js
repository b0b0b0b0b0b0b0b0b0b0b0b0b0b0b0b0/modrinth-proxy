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

export function normalizeContentRoute(contentType) {
  return String(contentType || 'mods').replace(/^discover\//, '').replace(/s$/, '') || 'mod'
}

export function getVersionGameVersions(version) {
  return Array.isArray(version?.game_versions) ? version.game_versions : []
}

export function getVersionLoaders(version) {
  return Array.isArray(version?.loaders) ? version.loaders : []
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
