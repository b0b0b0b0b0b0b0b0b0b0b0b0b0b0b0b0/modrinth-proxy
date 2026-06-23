import {
  buildAllowedLoaderIds,
  normalizeContentRoute,
  versionMatchesLoaders,
} from './contextualVersions'

export const ALTERNATE_PROJECT_FORMATS = {
  mod: {
    targetType: 'plugin',
    route: 'plugin',
    tooltip: 'У нас есть ещё плагин для сервера',
    linkLabel: 'Открыть плагин',
  },
  plugin: {
    targetType: 'mod',
    route: 'mod',
    tooltip: 'У нас есть ещё мод для клиента',
    linkLabel: 'Открыть мод',
  },
}

export function getProjectTypes(project) {
  const types = new Set()

  if (Array.isArray(project?.project_types) && project.project_types.length > 0) {
    project.project_types.forEach((type) => types.add(type))
  } else if (project?.project_type) {
    types.add(project.project_type)
  }

  const loaders = project?.loaders || []
  if (loaders.length > 0) {
    const modLoaderIds = buildAllowedLoaderIds('mods')
    const pluginLoaderIds = buildAllowedLoaderIds('plugins')
    if (loaders.some((loader) => modLoaderIds.has(loader))) types.add('mod')
    if (loaders.some((loader) => pluginLoaderIds.has(loader))) types.add('plugin')
  }

  return [...types]
}

export function resolveAlternateProjectFormat({
  project,
  contentType,
  versions = null,
}) {
  const contentRoute = normalizeContentRoute(contentType)
  const config = ALTERNATE_PROJECT_FORMATS[contentRoute]
  if (!config || !project?.slug) return null

  const projectTypes = getProjectTypes(project)
  if (!projectTypes.includes(config.targetType)) return null

  const targetLoaderIds = buildAllowedLoaderIds(
    config.route === 'plugin' ? 'plugins' : 'mods',
  )

  const hasTargetArtifacts =
    Array.isArray(versions) && versions.length > 0
      ? versions.some((version) => versionMatchesLoaders(version, targetLoaderIds))
      : (project.loaders || []).some((loader) => targetLoaderIds.has(loader))

  if (!hasTargetArtifacts) return null

  return {
    href: `/${config.route}/${project.slug}`,
    tooltip: config.tooltip,
    linkLabel: config.linkLabel,
  }
}
