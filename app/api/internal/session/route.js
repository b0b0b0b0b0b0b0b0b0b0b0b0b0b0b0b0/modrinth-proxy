import { timingSafeEqual } from 'crypto'
import { getUserBySessionToken } from '@/lib/auth'
import { userAvatarUrl } from '@/lib/minecraftAvatar'

export const dynamic = 'force-dynamic'

function allowed(request) {
  if (request.headers.get('x-real-ip')) return false
  const expected = Buffer.from(String(process.env.SSO_INTERNAL_KEY || ''))
  const actual = Buffer.from(request.headers.get('x-internal-key') || '')
  return expected.length >= 32 && expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function POST(request) {
  if (!allowed(request)) return new Response(null, { status: 404 })
  const body = await request.json().catch(() => null)
  const user = getUserBySessionToken(body?.token)
  if (!user) return Response.json({ user: null })
  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      mcName: user.mc_name || null,
      avatar: userAvatarUrl(user),
    },
  })
}
