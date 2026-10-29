import { MOD_LOADER_IDS, PLUGIN_FAMILY_IDS } from './loaders'

export const PROJECT_PAGE_ROUTES = {
  mod: 'mod',
  plugin: 'plugin',
  modpack: 'modpack',
  resourcepack: 'resourcepack',
  shader: 'shader',
  datapack: 'datapack',
  minecraft_java_server: 'server',
  server: 'server',
}

const PROJECT_PAGE_PREFIXES = Object.values(PROJECT_PAGE_ROUTES)

export function getPrimaryProjectType(project) {
  return (
    project?.project_type ??
    (Array.isArray(project?.project_types) ? project.project_types[0] : undefined)
  )
}

function projectLoaderFlags(project) {
  const loaders = Array.isArray(project?.loaders) ? project.loaders : []
  return {
    hasPluginLoader: loaders.some((loader) => PLUGIN_FAMILY_IDS.has(loader)),
    hasModLoader: loaders.some((loader) => MOD_LOADER_IDS.has(loader)),
    hasDatapackLoader: loaders.includes('datapack'),
  }
}

const LOADER_DRIVEN_TYPES = new Set(['mod', 'plugin', 'datapack'])

export function projectPageTypes(project) {
  const types = new Set()
  const declared = Array.isArray(project?.project_types) ? project.project_types : []
  const primaryType = getPrimaryProjectType(project)
  ;[...declared, primaryType].forEach((type) => {
    if (type) types.add(type === 'minecraft_java_server' ? 'server' : type)
  })
  if (!primaryType || LOADER_DRIVEN_TYPES.has(primaryType)) {
    const { hasPluginLoader, hasModLoader, hasDatapackLoader } = projectLoaderFlags(project)
    if (hasPluginLoader) types.add('plugin')
    if (hasModLoader) types.add('mod')
    if (hasDatapackLoader) types.add('datapack')
  }
  return types
}

export function determineActualProjectType(project) {
  const primaryType = getPrimaryProjectType(project)

  if (primaryType === 'minecraft_java_server') {
    return 'minecraft_java_server'
  }

  if (primaryType && primaryType !== 'mod' && primaryType !== 'plugin') {
    return primaryType
  }

  const { hasPluginLoader, hasModLoader, hasDatapackLoader } = projectLoaderFlags(project)
  if (!hasPluginLoader && !hasModLoader) {
    return hasDatapackLoader ? 'datapack' : primaryType
  }

  if (hasPluginLoader && !hasModLoader) {
    return 'plugin'
  }

  if (hasModLoader && !hasPluginLoader) {
    return 'mod'
  }

  return primaryType
}

export function resolveCanonicalProjectHref(project) {
  if (!project?.slug) return null
  const type = determineActualProjectType(project)
  const segment = PROJECT_PAGE_ROUTES[type] || 'mod'
  return `/${segment}/${project.slug}`
}

export function rewriteProjectPathToCanonical(pathnameWithSearch, project) {
  const canonicalBase = resolveCanonicalProjectHref(project)
  if (!canonicalBase || typeof pathnameWithSearch !== 'string') return null

  const qIndex = pathnameWithSearch.indexOf('?')
  const pathname = qIndex >= 0 ? pathnameWithSearch.slice(0, qIndex) : pathnameWithSearch
  const search = qIndex >= 0 ? pathnameWithSearch.slice(qIndex) : ''

  const prefix = PROJECT_PAGE_PREFIXES.find(
    (route) => pathname === `/${route}` || pathname.startsWith(`/${route}/`),
  )
  if (!prefix) return null

  if (projectPageTypes(project).has(prefix)) {
    return null
  }

  const rest = pathname.slice(`/${prefix}`.length)
  const slugAndTail = rest.startsWith('/') ? rest.slice(1) : rest
  const slash = slugAndTail.indexOf('/')
  const tail = slash >= 0 ? slugAndTail.slice(slash) : ''
  const nextPath = `${canonicalBase}${tail}${search}`

  return nextPath === pathnameWithSearch ? null : nextPath
}
