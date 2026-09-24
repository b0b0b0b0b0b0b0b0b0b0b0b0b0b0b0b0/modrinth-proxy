import { MODRINTH_API, MODRINTH_USER_AGENT } from './modrinth'
import { determineActualProjectType, resolveCanonicalProjectHref } from './projectType'

export const DEPENDENCY_TYPE_LABELS = {
  required: 'Требуется',
  optional: 'Опциональная',
  embedded: 'Встроенный',
  incompatible: 'Несовместимый',
}

export const DEPENDENCY_TYPE_STYLES = {
  required: 'bg-[rgba(var(--color-green-rgb),0.15)] text-modrinth-green border border-[rgba(var(--color-green-rgb),0.35)]',
  optional: 'bg-gray-800/60 text-gray-300 border border-gray-700/60',
  embedded: 'bg-blue-500/15 text-blue-300 border border-blue-500/35',
  incompatible: 'bg-red-500/15 text-red-400 border border-red-500/35',
}

export function toProjectInfo(project) {
  if (!project) return null
  return {
    id: project.id,
    slug: project.slug,
    title: project.title ?? project.name,
    icon_url: project.icon_url,
    project_type: determineActualProjectType(project),
    loaders: project.loaders,
  }
}

export function resolveProjectHref(project) {
  return resolveCanonicalProjectHref(project)
}

export function dependencyTypeLabel(type) {
  return DEPENDENCY_TYPE_LABELS[type] || type
}

export function dependencyTypeClass(type) {
  return DEPENDENCY_TYPE_STYLES[type] || DEPENDENCY_TYPE_STYLES.optional
}

function dependencyDedupeKey(dep) {
  if (dep.project_id) return dep.project_id
  if (dep.version_id) return `version:${dep.version_id}`
  if (dep.file_name) return `file:${dep.file_name}`
  return `unknown:${dep.dependency_type}`
}

async function modrinthFetch(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': MODRINTH_USER_AGENT },
    signal: AbortSignal.timeout(15000),
    next: { revalidate: 3600 },
  })
  if (!response.ok) return null
  return response.json()
}

export function listedDependencies(deps) {
  return (deps || []).filter(
    (d) =>
      d &&
      (d.project_id || d.version_id || d.file_name) &&
      (d.dependency_type === 'required' ||
        d.dependency_type === 'optional' ||
        d.dependency_type === 'embedded' ||
        d.dependency_type === 'incompatible'),
  )
}

export function fallbackDependenciesFromSiblings(version, versions = []) {
  const own = listedDependencies(version?.dependencies)
  if (own.length > 0) return own

  const loaders = new Set(version?.loaders || [])
  const candidates = (versions || [])
    .filter((item) => item && item.id !== version?.id && listedDependencies(item.dependencies).length > 0)
    .sort((a, b) => new Date(b.date_published || 0) - new Date(a.date_published || 0))

  if (candidates.length === 0) return own

  const overlapping = candidates.find((item) => (item.loaders || []).some((loader) => loaders.has(loader)))
  return listedDependencies((overlapping || candidates[0]).dependencies)
}

export async function enrichDependencies(rawDeps) {
  const relevant = listedDependencies(rawDeps).filter(
    (d) =>
      d.dependency_type === 'required' ||
      d.dependency_type === 'optional' ||
      d.dependency_type === 'embedded',
  )

  if (relevant.length === 0) return []

  const projectIds = [...new Set(relevant.map((d) => d.project_id).filter(Boolean))]
  let projects = []
  if (projectIds.length > 0) {
    try {
      const chunkSize = 100
      for (let i = 0; i < projectIds.length; i += chunkSize) {
        const chunk = projectIds.slice(i, i + chunkSize)
        const payload = await modrinthFetch(
          `${MODRINTH_API}/projects?ids=${encodeURIComponent(JSON.stringify(chunk))}`,
        )
        if (Array.isArray(payload)) projects.push(...payload)
      }
    } catch {
      projects = []
    }
  }

  const projectMap = new Map(projects.map((p) => [p.id, toProjectInfo(p)]))

  const seen = new Set()
  const result = []

  for (const dep of relevant) {
    const dedupeKey = dependencyDedupeKey(dep)
    const rowKey = `${dedupeKey}:${dep.dependency_type}`
    if (seen.has(rowKey)) continue
    seen.add(rowKey)

    if (!dep.project_id && !dep.version_id && !dep.file_name) continue

    const project = dep.project_id ? projectMap.get(dep.project_id) : null

    const label = project?.title || dep.file_name || 'Зависимость'
    result.push({
      ...dep,
      project: project ? { ...project, title: label } : null,
      dedupeKey,
      label,
    })
  }

  return result
}

export function filterNestedDependencies(
  deps,
  { ancestorIds = [], rootProjectIds = [], selfProjectId = null } = {},
) {
  const ancestors = new Set(ancestorIds.filter(Boolean))
  const roots = new Set(rootProjectIds.filter(Boolean))

  return (deps || []).filter((dep) => {
    if (!dep.project_id) return true
    if (selfProjectId && dep.project_id === selfProjectId) return false
    if (ancestors.has(dep.project_id)) return false
    if (roots.has(dep.project_id)) return false
    return true
  })
}

export async function fetchProjectDependencies(slugOrId) {
  try {
    const versions = await modrinthFetch(
      `${MODRINTH_API}/project/${slugOrId}/version?limit=1`,
    )
    if (!Array.isArray(versions) || versions.length === 0) return []
    return enrichDependencies(fallbackDependenciesFromSiblings(versions[0], versions))
  } catch {
    return []
  }
}

export async function fetchVersionDependencies(slugOrId, versionNumber) {
  try {
    const versions = await modrinthFetch(
      `${MODRINTH_API}/project/${slugOrId}/version`,
    )
    if (!Array.isArray(versions)) return []
    const match = versions.find(
      (v) => v.version_number === versionNumber || v.id === versionNumber,
    )
    if (!match) return []
    return enrichDependencies(fallbackDependenciesFromSiblings(match, versions))
  } catch {
    return []
  }
}
