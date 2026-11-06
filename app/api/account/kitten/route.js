import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { addKittenPets, readKittenPets } from '@/lib/kittenPets'
import { kittenProgress } from '@/lib/kittenLevels'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 240, windowMs: 60 * 1000 }
const NO_STORE = { 'Cache-Control': 'private, no-store' }

export const dynamic = 'force-dynamic'

function reply(user, pets) {
  return Response.json({ ...kittenProgress(pets), name: user.username }, { headers: NO_STORE })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ pets: null }, { headers: NO_STORE })
  return reply(user, readKittenPets(user.id))
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })
  const user = await getSessionUser()
  if (!user) return Response.json({ pets: null }, { headers: NO_STORE })
  const rate = checkRateLimit(`kitten-pets:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return reply(user, readKittenPets(user.id))
  const body = await request.json().catch(() => null)
  return reply(user, addKittenPets(user.id, body?.add))
}
