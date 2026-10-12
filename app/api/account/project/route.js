import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { getProjectState, isProjectId, rememberProject, setFavorite } from '@/lib/account'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 60, windowMs: 60_000 }

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!isProjectId(id)) return Response.json({ error: 'bad_id' }, { status: 400 })
  return Response.json(getProjectState(getSessionUser()?.id ?? null, id))
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-project:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  const projectId = body?.projectId
  if (!isProjectId(projectId) || typeof body?.favorite !== 'boolean') {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }

  const project = await rememberProject(projectId)
  if (!project) return Response.json({ error: 'not_found' }, { status: 404 })

  setFavorite(user.id, projectId, body.favorite)
  return Response.json(getProjectState(user.id, projectId))
}
