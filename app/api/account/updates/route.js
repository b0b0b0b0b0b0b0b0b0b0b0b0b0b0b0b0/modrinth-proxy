import { cookies } from 'next/headers'
import { FESTIVE_OFF_COOKIE, getSessionUser, isSameOrigin, setFestiveCookie, setNewsBadgeCookie } from '@/lib/auth'
import { dismissUpdates, getUpdates, isProjectId, isVariant } from '@/lib/account'
import { userAvatarUrl } from '@/lib/minecraftAvatar'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = getSessionUser()
  if (!user) return Response.json({ count: 0 })
  if (Boolean(user.hide_news_badge) !== (cookies().get('mp_news_off')?.value === '1')) {
    setNewsBadgeCookie(!user.hide_news_badge)
  }
  if (Boolean(user.hide_festive) !== (cookies().get(FESTIVE_OFF_COOKIE)?.value === '1')) {
    setFestiveCookie(!user.hide_festive)
  }
  const updates = await getUpdates(user.id)
  return Response.json({ count: updates.length, username: user.username, avatar: userAvatarUrl(user) })
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
