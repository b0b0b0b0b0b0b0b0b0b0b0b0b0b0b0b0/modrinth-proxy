import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { addDownload, parseDownloadUrl, rememberProject } from '@/lib/account'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 120, windowMs: 60_000 }

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return new Response(null, { status: 204 })

  const rate = checkRateLimit(`account-download:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  const download = parseDownloadUrl(body?.url)
  if (!download) return Response.json({ error: 'bad_request' }, { status: 400 })

  const project = await rememberProject(download.projectId)
  if (!project) return Response.json({ error: 'not_found' }, { status: 404 })

  const saved = await addDownload(user.id, download)
  if (!saved) return Response.json({ error: 'not_found' }, { status: 404 })
  return new Response(null, { status: 204 })
}
