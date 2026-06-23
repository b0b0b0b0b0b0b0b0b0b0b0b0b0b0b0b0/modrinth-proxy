const MODRINTH_API = 'https://api.modrinth.com/v2'

const PROJECT_ROUTES = {
  mod: 'mod',
  plugin: 'plugin',
  modpack: 'modpack',
  resourcepack: 'resourcepack',
  shader: 'shader',
  datapack: 'datapack',
  minecraft_java_server: 'server',
  server: 'server',
}

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
  const projectType =
    project.project_type ||
    (Array.isArray(project.project_types) ? project.project_types[0] : null)
  return {
    id: project.id,
    slug: project.slug,
    title: project.title ?? project.name,
    icon_url: project.icon_url,
    project_type: projectType,
  }
}

export function resolveProjectHref(project) {
  if (!project?.slug) return null
  const segment = PROJECT_ROUTES[project.project_type] || 'mod'
  return `/${segment}/${project.slug}`
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
    headers: { 'User-Agent': 'ModrinthProxyExample/1.0' },
    next: { revalidate: 3600 },
  })
  if (!response.ok) return null
  return response.json()
}

export async function enrichDependencies(rawDeps) {
  const relevant = (rawDeps || []).filter(
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
    return enrichDependencies(versions[0].dependencies || [])
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
    return enrichDependencies(match.dependencies || [])
  } catch {
    return []
  }
}
