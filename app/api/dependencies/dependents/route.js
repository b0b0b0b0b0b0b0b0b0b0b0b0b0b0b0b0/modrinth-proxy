import { getProjectDependents } from '@/lib/modrinth'
import { isProjectId } from '@/lib/dependentsFilter'
import { ALL_LOADER_IDS } from '@/lib/loaders'

const PROJECT_TYPES = ['mod', 'plugin', 'datapack', 'resourcepack', 'shader']

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const projectType = searchParams.get('type')
  if (!isProjectId(id) || !PROJECT_TYPES.includes(projectType)) {
    return Response.json({ dependents: [] }, { status: 400 })
  }
  const loaders = (searchParams.get('loaders') || '')
    .split(',')
    .filter((loader) => ALL_LOADER_IDS.has(loader))
    .slice(0, 20)

  const dependents = await getProjectDependents({ id, projectType, loaders })
  return Response.json(
    { dependents },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' } },
  )
}
