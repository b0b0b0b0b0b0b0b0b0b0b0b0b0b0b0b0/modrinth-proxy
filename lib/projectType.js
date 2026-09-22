const PLUGIN_LOADER_IDS = new Set([
  'bukkit',
  'folia',
  'paper',
  'purpur',
  'spigot',
  'sponge',
  'bungeecord',
  'waterfall',
  'velocity',
  'geyser',
])

const MOD_LOADER_IDS = new Set([
  'fabric',
  'forge',
  'neoforge',
  'quilt',
  'babric',
  'bta',
  'javaagent',
  'legacyfabric',
  'liteloader',
  'modloader',
  'nilloader',
  'ornithe',
  'rift',
])

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

export function determineActualProjectType(project) {
  const primaryType = getPrimaryProjectType(project)

  if (primaryType === 'minecraft_java_server') {
    return 'minecraft_java_server'
  }

  if (primaryType && primaryType !== 'mod' && primaryType !== 'plugin') {
    return primaryType
  }

  const loaders = Array.isArray(project?.loaders) ? project.loaders : []
  if (loaders.length === 0) {
    return primaryType
  }

  const hasPluginLoader = loaders.some((loader) => PLUGIN_LOADER_IDS.has(loader))
  const hasModLoader = loaders.some((loader) => MOD_LOADER_IDS.has(loader))

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

  const rest = pathname.slice(`/${prefix}`.length)
  const slugAndTail = rest.startsWith('/') ? rest.slice(1) : rest
  const slash = slugAndTail.indexOf('/')
  const tail = slash >= 0 ? slugAndTail.slice(slash) : ''
  const nextPath = `${canonicalBase}${tail}${search}`

  return nextPath === pathnameWithSearch ? null : nextPath
}
