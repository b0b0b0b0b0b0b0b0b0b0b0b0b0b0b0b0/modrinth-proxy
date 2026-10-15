import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { isProjectId, setNotifyMute } from '@/lib/account'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 }

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-notify-mute:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (!isProjectId(body?.projectId) || typeof body?.muted !== 'boolean') {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }

  setNotifyMute(user.id, body.projectId, body.muted)
  return Response.json({ muted: body.muted })
}
