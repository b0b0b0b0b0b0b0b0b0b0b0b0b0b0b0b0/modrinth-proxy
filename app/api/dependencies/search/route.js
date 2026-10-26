import { filterModsList } from '@/lib/contentFilter'
import { fetchSearchResults } from '@/lib/modrinth'

const PROJECT_TYPES = ['mod', 'resourcepack', 'shader', 'datapack', 'plugin']
const LIMIT = 8

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || '').trim().slice(0, 100)
  if (!query) return Response.json({ hits: [] })

  const id = query.replace(/[^a-zA-Z0-9]/g, '')
  try {
    const [byQuery, byId] = await Promise.all([
      fetchSearchResults({
        query,
        facets: [PROJECT_TYPES.map((type) => `project_type:${type}`)],
        limit: LIMIT,
        nextRevalidate: 600,
      }),
      id.length === 8
        ? fetchSearchResults({ facets: [[`project_id:${id}`]], limit: 1, nextRevalidate: 600 }).catch(() => null)
        : null,
    ])
    const seen = new Set()
    const merged = [...(byId?.hits || []), ...(byQuery?.hits || [])].filter(
      (hit) => PROJECT_TYPES.includes(hit.project_type) && !seen.has(hit.project_id) && seen.add(hit.project_id),
    )
    const { hits } = await filterModsList(merged)
    return Response.json({
      hits: hits.slice(0, LIMIT).map((hit) => ({
        id: hit.project_id,
        slug: hit.slug,
        title: hit.title,
        icon_url: hit.icon_url,
        project_type: hit.project_type,
      })),
    })
  } catch {
    return Response.json({ hits: [] }, { status: 502 })
  }
}
