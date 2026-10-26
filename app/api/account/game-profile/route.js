import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { getGameProfile, isGameLoader, isGameVersion, isServerCore, setGameProfile } from '@/lib/account'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }
const FIELDS = {
  gameLoader: ['loader', isGameLoader],
  gameVersion: ['gameVersion', isGameVersion],
  serverCore: ['serverCore', isServerCore],
  serverVersion: ['serverVersion', isGameVersion],
}

export const dynamic = 'force-dynamic'

function snapshot(user) {
  const { chosen } = getGameProfile(user.id)
  return {
    account: user.id,
    profile: Object.fromEntries(Object.entries(FIELDS).map(([name, [key]]) => [name, chosen[key] || ''])),
  }
}

export async function GET() {
  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  return Response.json(snapshot(user))
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-game-import:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  const incoming = body?.import
  if (!incoming || typeof incoming !== 'object') return Response.json({ error: 'bad_request' }, { status: 400 })

  const { chosen } = getGameProfile(user.id)
  const changes = {}
  for (const [name, [key, valid]] of Object.entries(FIELDS)) {
    const value = incoming[name]
    if (typeof value === 'string' && value && !chosen[key] && valid(value)) changes[key] = value
  }
  if (Object.keys(changes).length > 0) setGameProfile(user.id, changes)
  return Response.json(snapshot(user))
}
