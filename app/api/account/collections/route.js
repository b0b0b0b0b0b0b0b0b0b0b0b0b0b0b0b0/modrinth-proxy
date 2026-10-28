import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { isProjectId, rememberProject } from '@/lib/account'
import { checkRateLimit } from '@/lib/rateLimit'
import {
  createCollection,
  deleteCollection,
  getProjectCollections,
  listCollections,
  normalizeCollectionName,
  parseCollectionId,
  renameCollection,
  setCollectionItem,
} from '@/lib/userCollections'

const RATE_LIMIT = { limit: 120, windowMs: 60_000 }

export const dynamic = 'force-dynamic'

function fail(error, status) {
  return Response.json({ error }, { status })
}

function stateFor(userId, projectId) {
  return { signedIn: true, collections: getProjectCollections(userId, projectId) }
}

async function guard(request) {
  if (!isSameOrigin(request)) return { response: fail('forbidden', 403) }
  const user = getSessionUser()
  if (!user) return { response: fail('unauthorized', 401) }
  const rate = checkRateLimit(`account-collections:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return { response: fail('rate_limit', 429) }
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return { response: fail('bad_request', 400) }
  return { user, body }
}

async function addProject(userId, collectionId, projectId) {
  if (!(await rememberProject(projectId))) return fail('not_found', 404)
  const result = setCollectionItem(userId, collectionId, projectId, true)
  if (result.error) return fail(result.error, result.error === 'limit' ? 409 : 404)
  return null
}

export async function GET(request) {
  const user = getSessionUser()
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!user) return Response.json({ signedIn: false, collections: [] })
  if (projectId == null) {
    return Response.json({
      signedIn: true,
      collections: listCollections(user.id).map(({ id, name, count }) => ({ id, name, count })),
    })
  }
  if (!isProjectId(projectId)) return fail('bad_id', 400)
  return Response.json(stateFor(user.id, projectId))
}

export async function POST(request) {
  const { user, body, response } = await guard(request)
  if (response) return response

  const name = normalizeCollectionName(body.name)
  const projectId = body.projectId ?? null
  if (!name || (projectId !== null && !isProjectId(projectId))) return fail('bad_request', 400)

  const created = createCollection(user.id, name)
  if (created.error) return fail(created.error, 409)
  if (projectId) {
    const failed = await addProject(user.id, created.id, projectId)
    if (failed) return failed
    return Response.json({ id: created.id, ...stateFor(user.id, projectId) })
  }
  return Response.json({ id: created.id })
}

export async function PATCH(request) {
  const { user, body, response } = await guard(request)
  if (response) return response

  const collectionId = parseCollectionId(body.id)
  if (!collectionId) return fail('bad_request', 400)

  if (body.name !== undefined) {
    const name = normalizeCollectionName(body.name)
    if (!name) return fail('bad_request', 400)
    if (!renameCollection(user.id, collectionId, name)) return fail('not_found', 404)
    return Response.json({ ok: true })
  }

  if (!isProjectId(body.projectId) || typeof body.on !== 'boolean') return fail('bad_request', 400)
  if (body.on) {
    const failed = await addProject(user.id, collectionId, body.projectId)
    if (failed) return failed
  } else {
    const result = setCollectionItem(user.id, collectionId, body.projectId, false)
    if (result.error) return fail(result.error, 404)
  }
  return Response.json(stateFor(user.id, body.projectId))
}

export async function DELETE(request) {
  const { user, body, response } = await guard(request)
  if (response) return response

  const collectionId = parseCollectionId(body.id)
  if (!collectionId) return fail('bad_request', 400)
  if (!deleteCollection(user.id, collectionId)) return fail('not_found', 404)
  return Response.json({ ok: true })
}
