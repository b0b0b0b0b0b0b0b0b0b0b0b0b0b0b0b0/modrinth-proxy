import { CATALOG_SEO } from './catalogSearchSeo'
import { searchMods } from './modrinth'

const CATALOG_ORDER = ['mods', 'plugins', 'modpacks', 'resourcepacks', 'shaders', 'datapacks']

function pluralizeRu(count, one, few, many) {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return many
  if (n1 > 1 && n1 < 5) return few
  if (n1 === 1) return one
  return many
}

export function formatCatalogCount(count, noun) {
  return `${count.toLocaleString('ru-RU')} ${pluralizeRu(count, noun.one, noun.few, noun.many)}`
}

export function buildCatalogSearchUrl(categoryPath, catalogKey, query, version) {
  const isDiscover = categoryPath.startsWith('discover/')
  const path = isDiscover ? `discover/${catalogKey}` : catalogKey
  const params = new URLSearchParams()
  if (query?.trim()) params.set('q', query.trim())
  if (version?.trim()) params.set('v', version.trim())
  const qs = params.toString()
  return `/${path}${qs ? `?${qs}` : ''}`
}

export async function findCatalogSearchAlternatives(currentKey, query, { version } = {}) {
  const trimmed = query?.trim()
  if (!trimmed) return []

  const others = CATALOG_ORDER.filter((key) => key !== currentKey)

  const found = await Promise.all(
    others.map(async (key) => {
      const config = CATALOG_SEO[key]
      const facets = [...config.facet]
      if (version?.trim()) {
        facets.push([`versions:${version.trim()}`])
      }

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
            label: config.label,
            noun: config.noun,
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
