import { CATALOG_SEO } from './catalogSearchSeo'
import { searchMods } from './modrinth'
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

export async function findCatalogSearchAlternatives(currentKey, query, { version } = {}) {
  const trimmed = query?.trim()
  if (!trimmed) return []

  const others = CATALOG_ORDER.filter((key) => key !== currentKey)
  const versionsFacet = versionFacets(normalizeVersions(version))

  const found = await Promise.all(
    others.map(async (key) => {
      const config = CATALOG_SEO[key]
      const facets = [...config.facet]
      if (versionsFacet) facets.push(versionsFacet)

      try {
        const data = await searchMods({
          query: trimmed,
          facets,
          limit: 1,
          offset: 0,
          nextRevalidate: 3600,
        })
        const totalHits = data?.total_hits ?? 0
        if (totalHits > 0) {
          return {
            key,
            totalHits,
          }
        }
      } catch {
        return null
      }
      return null
    }),
  )

  return found
    .filter(Boolean)
    .sort((a, b) => b.totalHits - a.totalHits)
    .slice(0, 4)
}
