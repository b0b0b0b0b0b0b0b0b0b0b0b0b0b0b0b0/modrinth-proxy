import { cookies } from 'next/headers'
import { getSessionUser, isSameOrigin, setNewsBadgeCookie } from '@/lib/auth'
import { dismissUpdates, getUpdates, isProjectId, isVariant } from '@/lib/account'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = getSessionUser()
  if (!user) return Response.json({ count: 0 })
  if (Boolean(user.hide_news_badge) !== (cookies().get('mp_news_off')?.value === '1')) {
    setNewsBadgeCookie(!user.hide_news_badge)
  }
  const updates = await getUpdates(user.id)
  return Response.json({ count: updates.length })
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (body?.projectId == null) {
    await dismissUpdates(user.id)
    return Response.json({ ok: true })
  }

  const target = { projectId: body.projectId, versionId: body.versionId, variant: body.variant ?? '' }
  if (!isProjectId(target.projectId) || !isProjectId(target.versionId) || !isVariant(target.variant)) {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }

  await dismissUpdates(user.id, target)
  return Response.json({ ok: true })
}
