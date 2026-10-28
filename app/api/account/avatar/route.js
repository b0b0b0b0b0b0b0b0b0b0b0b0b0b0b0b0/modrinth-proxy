import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'
import { lookupMinecraftProfile, minecraftAvatarUrl, setUserAvatar } from '@/lib/minecraftAvatar'

const LOOKUP_LIMIT = { limit: 30, windowMs: 60_000 }
const WRITE_LIMIT = { limit: 10, windowMs: 60_000 }
const STATUS = { invalid: 400, not_found: 404, rate_limit: 429, mojang: 502 }

export const dynamic = 'force-dynamic'

function fail(error) {
  return Response.json({ error }, { status: STATUS[error] || 400 })
}

export async function GET(request) {
  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  if (!checkRateLimit(`account-avatar-lookup:${user.id}`, LOOKUP_LIMIT).ok) return fail('rate_limit')

  const found = await lookupMinecraftProfile(new URL(request.url).searchParams.get('name'))
  if (found.error) return fail(found.error)
  return Response.json(
    { name: found.profile.name, image: minecraftAvatarUrl(found.profile.id) },
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  )
}

async function guard(request) {
  if (!isSameOrigin(request)) return { response: Response.json({ error: 'forbidden' }, { status: 403 }) }
  const user = getSessionUser()
  if (!user) return { response: Response.json({ error: 'unauthorized' }, { status: 401 }) }
  if (!checkRateLimit(`account-avatar-write:${user.id}`, WRITE_LIMIT).ok) return { response: fail('rate_limit') }
  return { user }
}

export async function POST(request) {
  const { user, response } = await guard(request)
  if (response) return response

  const body = await request.json().catch(() => null)
  const found = await lookupMinecraftProfile(body?.name)
  if (found.error) return fail(found.error)
  return Response.json({ name: found.profile.name, avatar: setUserAvatar(user.id, found.profile) })
}

export async function DELETE(request) {
  const { user, response } = await guard(request)
  if (response) return response

  setUserAvatar(user.id, null)
  return Response.json({ avatar: null })
}
