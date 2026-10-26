import { MOD_LOADER_IDS, PLUGIN_FAMILY_IDS, canonicalizeLoaderId } from './loaders'

const PROJECT_ID = /^[A-Za-z0-9]{8}$/

const DEPENDENCY_FIELDS = new Set([
  'required_dependency_project_ids',
  'optional_dependency_project_ids',
  'embedded_dependency_project_ids',
  'compatible_dependency_project_ids',
])

const CATALOG_PROJECT_TYPES = {
  mods: 'mod',
  plugins: 'plugin',
  datapacks: 'datapack',
  resourcepacks: 'resourcepack',
  shaders: 'shader',
  modpacks: 'modpack',
}

const MOD_LIKE_TYPES = ['mod', 'plugin', 'datapack']

function allParams(searchParams, key) {
  if (!searchParams) return []
  if (typeof searchParams.getAll === 'function') return searchParams.getAll(key)
  const value = searchParams[key]
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

export const DEPENDENCY_TYPES = ['required', 'optional', 'embedded']

function dependencyFields(catalog, types) {
  if (catalog === 'modpacks') return ['compatible_dependency_project_ids']
  return (types.length > 0 ? types : ['required']).map((type) => `${type}_dependency_project_ids`)
}

export function formatDependentParam(id, types = []) {
  return types.length > 0 ? `${types.join(',')}:${id}` : id
}

function parseDependentValue(value) {
  const raw = String(value ?? '').trim()
  const index = raw.indexOf(':')
  const id = index === -1 ? raw : raw.slice(index + 1)
  if (!PROJECT_ID.test(id)) return null
  const types = index === -1 ? [] : raw.slice(0, index).split(',').filter((type) => DEPENDENCY_TYPES.includes(type))
  return { id, types: [...new Set(types)] }
}

export function parseDependentOptions(searchParams) {
  const seen = new Set()
  return allParams(searchParams, 'dep')
    .map(parseDependentValue)
    .filter((option) => option && !seen.has(option.id) && seen.add(option.id))
}

export function parseDependentParam(searchParams) {
  return parseDependentOptions(searchParams)[0]?.id ?? ''
}

export function appendDependentFacets(facets, searchParams, catalog) {
  for (const option of parseDependentOptions(searchParams)) {
    facets.push(dependencyFields(catalog, option.types).map((field) => `${field}:${option.id}`))
  }
}

export function copyDependentParams(params, searchParams) {
  params.delete('dep')
  for (const option of parseDependentOptions(searchParams)) {
    params.append('dep', formatDependentParam(option.id, option.types))
  }
}

export function replaceDependentParams(searchParams, options) {
  const params = new URLSearchParams(searchParams?.toString() ?? '')
  params.delete('dep')
  params.delete('page')
  for (const option of options) params.append('dep', formatDependentParam(option.id, option.types))
  return params
}

export function dependentCatalogsFor(projectType, loaders = []) {
  if (projectType === 'resourcepack') return ['resourcepacks', 'modpacks']
  if (projectType === 'shader') return ['shaders', 'modpacks']
  if (!MOD_LIKE_TYPES.includes(projectType)) return []
  const ids = loaders.map(canonicalizeLoaderId)
  const catalogs = []
  if (ids.some((id) => MOD_LOADER_IDS.has(id))) catalogs.push('mods')
  if (ids.some((id) => PLUGIN_FAMILY_IDS.has(id))) catalogs.push('plugins')
  if (ids.includes('datapack')) catalogs.push('datapacks')
  if (catalogs.length === 0) catalogs.push('mods')
  if (catalogs.length > 1 || catalogs[0] !== 'plugins') catalogs.push('modpacks')
  return catalogs
}

export function isProjectId(value) {
  return PROJECT_ID.test(String(value ?? ''))
}

export function dependentCatalogFacets(catalog, projectId) {
  return [[`project_type:${CATALOG_PROJECT_TYPES[catalog]}`], dependencyFields(catalog, ['required']).map((field) => `${field}:${projectId}`)]
}

export function dependentCatalogHref(catalog, projectId) {
  return `/discover/${catalog}?dep=${formatDependentParam(projectId, ['required'])}`
}

function isDependencyFacet(facet) {
  if (typeof facet !== 'string') return false
  const index = facet.indexOf(':')
  if (index === -1) return false
  return DEPENDENCY_FIELDS.has(facet.slice(0, index)) && PROJECT_ID.test(facet.slice(index + 1))
}

export function splitDependencyFacets(facets) {
  const rest = []
  const filters = []
  for (const group of facets) {
    const list = Array.isArray(group) ? group : [group]
    if (!list.some(isDependencyFacet)) {
      rest.push(group)
      continue
    }
    const conditions = list.filter(isDependencyFacet).map((facet) => {
      const index = facet.indexOf(':')
      return `${facet.slice(0, index)} = "${facet.slice(index + 1)}"`
    })
    filters.push(conditions.length === 1 ? conditions[0] : `(${conditions.join(' OR ')})`)
  }
  return { facets: rest, newFilters: filters.join(' AND ') }
}
