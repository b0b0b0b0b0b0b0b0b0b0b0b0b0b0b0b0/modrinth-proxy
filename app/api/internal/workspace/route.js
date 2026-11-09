import { getUserBySessionToken } from '@/lib/auth'
import { isInternalRequest } from '@/lib/internalApi'
import {
  isBackupId,
  listToolWorkspaceBackups,
  readToolWorkspace,
  readToolWorkspaceBackup,
  restoreToolWorkspaceBackup,
  saveToolWorkspace,
} from '@/lib/toolWorkspace'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 1536 * 1024
const ACTIONS = new Set(['get', 'save', 'backups', 'backup', 'restore'])
const NO_STORE = { 'Cache-Control': 'private, no-store' }

function reply(body, status = 200) {
  return Response.json(body, { status, headers: NO_STORE })
}

async function readBody(request) {
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > MAX_BODY_BYTES) return null
  const text = await request.text().catch(() => null)
  if (!text || text.length > MAX_BODY_BYTES) return null
  try {
    const body = JSON.parse(text)
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null
  } catch {
    return null
  }
}

export async function POST(request) {
  if (!isInternalRequest(request)) return new Response(null, { status: 404 })
  const body = await readBody(request)
  if (!body || typeof body.action !== 'string' || !ACTIONS.has(body.action)) return reply({ error: 'bad_request' }, 400)
  const user = getUserBySessionToken(body.token)
  if (!user) return reply({ error: 'unauthorized' }, 401)

  if (body.action === 'get') {
    const stored = readToolWorkspace(user.id)
    return reply({ userId: user.id, workspace: stored?.data ?? null, revision: stored?.revision ?? 0, updatedAt: stored?.updatedAt ?? null })
  }

  if (body.action === 'save') {
    const reason = typeof body.reason === 'string' ? body.reason : 'auto'
    const baseRevision = body.baseRevision === null || body.baseRevision === undefined ? null : body.baseRevision
    const result = saveToolWorkspace(user.id, body.workspace, { reason, baseRevision })
    if (result.ok) return reply({ ok: true, revision: result.revision })
    if (result.conflict) return reply({ error: 'conflict', revision: result.revision }, 409)
    if (result.error === 'rate') return reply({ error: 'rate_limited' }, 429)
    return reply({ error: 'invalid' }, 400)
  }

  if (body.action === 'backups') {
    return reply({ backups: listToolWorkspaceBackups(user.id) })
  }

  if (!isBackupId(body.id)) return reply({ error: 'bad_request' }, 400)

  if (body.action === 'backup') {
    const backup = readToolWorkspaceBackup(user.id, body.id)
    return backup ? reply({ backup }) : reply({ error: 'not_found' }, 404)
  }

  const restored = restoreToolWorkspaceBackup(user.id, body.id)
  if (restored.ok) return reply({ ok: true, revision: restored.revision, workspace: restored.data })
  if (restored.error === 'rate') return reply({ error: 'rate_limited' }, 429)
  if (restored.error === 'missing') return reply({ error: 'not_found' }, 404)
  return reply({ error: 'invalid' }, 400)
}
