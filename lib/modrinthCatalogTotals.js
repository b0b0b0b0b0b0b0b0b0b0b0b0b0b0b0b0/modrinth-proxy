import { unstable_cache } from 'next/cache'
import { searchMods, MODRINTH_SERVER_API } from './modrinth'

const DAY_SEC = 60 * 60 * 24

const PROJECT_TYPE_FACETS = [
  { key: 'mod', facet: ['project_type:mod'] },
  { key: 'plugin', facet: ['project_type:plugin'] },
  { key: 'shader', facet: ['project_type:shader'] },
  { key: 'resourcepack', facet: ['project_type:resourcepack'] },
  { key: 'datapack', facet: ['project_type:datapack'] },
  { key: 'modpack', facet: ['project_type:modpack'] },
]

async function fetchPlatformStatisticsUncached() {
  const response = await fetch(`${MODRINTH_SERVER_API}/statistics`, {
    headers: {
      'User-Agent': 'ModrinthProxyExample/1.0',
    },
    next: { revalidate: DAY_SEC },
  })

  if (!response.ok) {
    throw new Error(`Modrinth statistics error: ${response.status}`)
  }

  const data = await response.json()
  const pick = (key) => {
    const n = Number(data?.[key])
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  }

  return {
    projects: pick('projects'),
    versions: pick('versions'),
    authors: pick('authors'),
    files: pick('files'),
  }
}

export const getModrinthPlatformStatistics = unstable_cache(
  fetchPlatformStatisticsUncached,
  ['modrinth-platform-statistics'],
  { revalidate: DAY_SEC },
)

async function fetchProjectTypeTotalsUncached() {
  const pairs = await Promise.all(
    PROJECT_TYPE_FACETS.map(async ({ key, facet }) => {
      try {
        const page = await searchMods({
          facets: [facet],
          limit: 1,
          offset: 0,
          nextRevalidate: DAY_SEC,
        })
        const n =
          typeof page?.total_hits === 'number' ? Math.floor(page.total_hits) : 0
        return [key, n]
      } catch {
        return [key, 0]
      }
    }),
  )
  return Object.fromEntries(pairs)
}

export const getModrinthProjectTypeTotals = unstable_cache(
  fetchProjectTypeTotalsUncached,
  ['modrinth-project-type-total-hits'],
  { revalidate: DAY_SEC },
)
