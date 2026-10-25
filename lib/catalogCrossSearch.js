import { CATALOG_SEO } from './catalogSearchSeo'
import { fetchSearchResults } from './modrinth'
import { appendVersionParams, versionFacets } from './catalogVersionParams'

const CATALOG_ORDER = ['mods', 'plugins', 'modpacks', 'resourcepacks', 'shaders', 'datapacks']

function normalizeVersions(version) {
  if (Array.isArray(version)) return version.filter(Boolean)
  if (typeof version === 'string' && version.trim()) return [version.trim()]
  return []
}

export function buildCatalogSearchUrl(categoryPath, catalogKey, query, version) {
  const isDiscover = categoryPath.startsWith('discover/')
  const path = isDiscover ? `discover/${catalogKey}` : catalogKey
  const params = new URLSearchParams()
  if (query?.trim()) params.set('q', query.trim())
  appendVersionParams(params, normalizeVersions(version))
  const qs = params.toString()
  return `/${path}${qs ? `?${qs}` : ''}`
}

const COMBINED_LIMIT = 100
const MOD_LOADERS = new Set(['fabric', 'forge', 'neoforge', 'quilt', 'liteloader', 'babric', 'bta-babric', 'rift', 'legacy-fabric', 'ornithe', 'modloader', 'nilloader', 'java-agent'])
const PLUGIN_LOADERS = new Set(['paper', 'purpur', 'spigot', 'bukkit', 'folia', 'velocity', 'bungeecord', 'waterfall', 'sponge', 'geyser'])
const SHADER_LOADERS = new Set(['iris', 'optifine', 'canvas', 'vanilla'])

function hitCatalogs(hit) {
  const categories = Array.isArray(hit?.categories) ? hit.categories : []
  const type = hit?.project_type
  const out = []
  if (type === 'modpack') out.push('modpacks')
  if (type === 'resourcepack' || categories.includes('minecraft')) out.push('resourcepacks')
  if (type === 'shader' || categories.some((c) => SHADER_LOADERS.has(c))) out.push('shaders')
  if (categories.includes('datapack')) out.push('datapacks')
  if (categories.some((c) => PLUGIN_LOADERS.has(c))) out.push('plugins')
  if (type === 'mod' && categories.some((c) => MOD_LOADERS.has(c))) out.push('mods')
  return out
}

function rankAlternatives(entries) {
  return entries
    .filter((entry) => entry && entry.totalHits > 0)
    .sort((a, b) => b.totalHits - a.totalHits)
    .slice(0, 4)
}

async function countPerCatalog(others, query, versionsFacet) {
  const found = await Promise.all(
    others.map(async (key) => {
      const facets = [...CATALOG_SEO[key].facet]
      if (versionsFacet) facets.push(versionsFacet)
      try {
        const data = await fetchSearchResults({ query, facets, limit: 1, offset: 0, nextRevalidate: 3600 })
        return { key, totalHits: data?.total_hits ?? 0 }
      } catch {
        return null
      }
    }),
  )
  return rankAlternatives(found)
}

export async function findCatalogSearchAlternatives(currentKey, query, { version } = {}) {
  const trimmed = query?.trim()
  if (!trimmed) return []

  const others = CATALOG_ORDER.filter((key) => key !== currentKey)
  const versionsFacet = versionFacets(normalizeVersions(version))

  const facets = [others.flatMap((key) => CATALOG_SEO[key].facet[0])]
  if (versionsFacet) facets.push(versionsFacet)

  let data
  try {
    data = await fetchSearchResults({ query: trimmed, facets, limit: COMBINED_LIMIT, offset: 0, nextRevalidate: 3600 })
  } catch {
    return []
  }

  const total = data?.total_hits ?? 0
  if (total === 0) return []
  if (total > COMBINED_LIMIT) return countPerCatalog(others, trimmed, versionsFacet)

  const counts = new Map(others.map((key) => [key, 0]))
  for (const hit of data?.hits || []) {
    for (const key of hitCatalogs(hit)) {
      if (counts.has(key)) counts.set(key, counts.get(key) + 1)
    }
  }
  return rankAlternatives([...counts].map(([key, totalHits]) => ({ key, totalHits })))
}
