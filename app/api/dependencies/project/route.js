import { isProjectAccessDenied } from '@/lib/contentFilter'
import { toProjectInfo } from '@/lib/dependencies'
import { getMod } from '@/lib/modrinth'
import { rateLimitResponse } from '@/lib/rateLimit'

const SLUG_RE = /^[\w!@$()`.+,"\-']{1,64}$/

export async function GET(request) {
  const limited = rateLimitResponse(request, 'deps-project', { limit: 120 })
  if (limited) return limited
  const { searchParams } = new URL(request.url)
  const slugOrId = searchParams.get('id') || searchParams.get('slug')
  if (!slugOrId || !SLUG_RE.test(slugOrId)) return Response.json({ error: 'slug or id required' }, { status: 400 })
  try {
    const project = await getMod(slugOrId)
    if (await isProjectAccessDenied(slugOrId, project)) {
      return Response.json({ error: 'project not found' }, { status: 404 })
    }
    return Response.json(toProjectInfo(project))
  } catch {
    return Response.json({ error: 'project not found' }, { status: 404 })
  }
}
