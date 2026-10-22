import { cache } from 'react'
import { getDb } from './db'
import { fetchSearchResults, searchMods } from './modrinth'

export const FAVORITES_SORT = 'favorites'

const RANK_LIMIT = 300
const CHUNK_SIZE = 100
const COUNTS_TTL_MS = 60 * 1000
const PINNED_REVALIDATE_S = 600
const TAIL_REVALIDATE_S = 3600
const TAIL_INDEX = 'follows'
const SERVER_TYPE = 'minecraft_java_server'
const MOD_LIKE_TYPES = ['mod', 'plugin', 'datapack']

const countsCache = new Map()

function facetProjectType(facets) {
  for (const group of facets) {
    const list = Array.isArray(group) ? group : [group]
    const facet = list.find((item) => typeof item === 'string' && item.startsWith('project_type:'))
    if (facet) return facet.slice('project_type:'.length)
  }
  return ''
}

function storedTypes(type) {
  if (!type) return null
  return MOD_LIKE_TYPES.includes(type) ? MOD_LIKE_TYPES : [type]
}

function favoriteCounts(type) {
  const cached = countsCache.get(type)
  if (cached && Date.now() - cached.at < COUNTS_TTL_MS) return cached.counts

  const types = storedTypes(type)
  const where = types
    ? `projects.project_type IN (${types.map(() => '?').join(', ')})`
    : 'projects.project_type != ?'
  const rows = getDb()
    .prepare(
      `SELECT favorites.project_id AS id, COUNT(*) AS n
       FROM favorites JOIN projects ON projects.id = favorites.project_id
       WHERE ${where}
       GROUP BY favorites.project_id
       ORDER BY n DESC
       LIMIT ?`,
    )
    .all(...(types || [SERVER_TYPE]), RANK_LIMIT)

  const counts = new Map(rows.map((row) => [row.id, row.n]))
  countsCache.set(type, { at: Date.now(), counts })
  return counts
}

const loadPinned = cache(async (query, facetsKey) => {
  const facets = JSON.parse(facetsKey)
  const probe = await searchMods({ query, facets, limit: 1, offset: 0, index: TAIL_INDEX })
  const effectiveQuery = probe?.effectiveQuery ?? query
  const counts = favoriteCounts(facetProjectType(facets))
  const ids = [...counts.keys()]

  const chunks = []
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) chunks.push(ids.slice(i, i + CHUNK_SIZE))

  const pages = await Promise.all(
    chunks.map((chunk) =>
      fetchSearchResults({
        query: effectiveQuery,
        facets: [...facets, chunk.map((id) => `project_id:${id}`)],
        limit: CHUNK_SIZE,
        offset: 0,
        index: TAIL_INDEX,
        nextRevalidate: PINNED_REVALIDATE_S,
      }),
    ),
  )

  const pinned = pages
    .flatMap((page) => page?.hits || [])
    .filter((hit) => counts.has(hit.project_id))
    .sort((a, b) => counts.get(b.project_id) - counts.get(a.project_id) || (b.follows || 0) - (a.follows || 0))

  return {
    pinned,
    effectiveQuery,
    layoutCorrection: probe?.layoutCorrection ?? null,
    totalHits: probe?.total_hits ?? pinned.length,
  }
})

export function favoritesSearchBatch({ query = '', facets = [] }) {
  return async ({ limit = 20, offset = 0 }) => {
    const { pinned, effectiveQuery, layoutCorrection, totalHits } = await loadPinned(query, JSON.stringify(facets))
    const head = pinned.slice(offset, offset + limit)
    const result = {
      hits: head,
      offset,
      limit,
      total_hits: Math.max(totalHits, pinned.length),
      effectiveQuery,
      layoutCorrection: offset === 0 ? layoutCorrection : null,
    }

    const need = limit - head.length
    if (need <= 0) return result

    const tail = await fetchSearchResults({
      query: effectiveQuery,
      facets: [...facets, ...pinned.map((hit) => [`project_id!=${hit.project_id}`])],
      limit: need,
      offset: Math.max(0, offset - pinned.length),
      index: TAIL_INDEX,
      nextRevalidate: TAIL_REVALIDATE_S,
    })

    return {
      ...result,
      hits: head.concat(tail?.hits || []),
      total_hits: pinned.length + (tail?.total_hits ?? 0),
    }
  }
}

export function catalogSearchBatch({ query = '', facets = [], index }) {
  if (index === FAVORITES_SORT) return favoritesSearchBatch({ query, facets })
  return (opts) => searchMods({ query, facets, index, ...opts })
}
