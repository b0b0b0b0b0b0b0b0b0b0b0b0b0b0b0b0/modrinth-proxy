import { toProjectInfo } from '@/lib/dependencies'
import { getMod } from '@/lib/modrinth'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const slugOrId = searchParams.get('id') || searchParams.get('slug')
  if (!slugOrId) return Response.json({ error: 'slug or id required' }, { status: 400 })
  try {
    const project = await getMod(slugOrId)
    return Response.json(toProjectInfo(project))
  } catch {
    return Response.json({ error: 'project not found' }, { status: 404 })
  }
}
