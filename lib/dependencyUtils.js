import { resolveCanonicalProjectHref } from './projectType'

export const DEPENDENCY_TYPE_LABELS = {
  required: 'Требуется',
  optional: 'Опциональная',
  embedded: 'Встроенная',
}

export function resolveProjectHref(project) {
  return resolveCanonicalProjectHref(project) || '#'
}

export function dependencyTypeLabel(type) {
  return DEPENDENCY_TYPE_LABELS[type] ?? type
}

export function dedupeDependencies(deps) {
  const seen = new Set()
  const out = []
  for (const dep of deps) {
    if (!dep.project_id) continue
    const key = `${dep.project_id}:${dep.dependency_type}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(dep)
  }
  return out
}