import { getUserBySessionToken } from '@/lib/auth'
import { isInternalRequest } from '@/lib/internalApi'
import { absoluteAvatarUrl, userAvatarUrl } from '@/lib/minecraftAvatar'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isInternalRequest(request)) return new Response(null, { status: 404 })
  const body = await request.json().catch(() => null)
  const user = getUserBySessionToken(body?.token)
  if (!user) return Response.json({ user: null })
  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      mcName: user.mc_name || null,
      avatar: absoluteAvatarUrl(userAvatarUrl(user)),
    },
  })
}
