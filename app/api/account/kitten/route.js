import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { addKittenPets, readKittenPets } from '@/lib/kittenPets'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 240, windowMs: 60 * 1000 }
const NO_STORE = { 'Cache-Control': 'private, no-store' }

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ pets: null }, { headers: NO_STORE })
  return Response.json({ pets: readKittenPets(user.id) }, { headers: NO_STORE })
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })
  const user = await getSessionUser()
  if (!user) return Response.json({ pets: null }, { headers: NO_STORE })
  const rate = checkRateLimit(`kitten-pets:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ pets: readKittenPets(user.id) }, { headers: NO_STORE })
  const body = await request.json().catch(() => null)
  return Response.json({ pets: addKittenPets(user.id, body?.add) }, { headers: NO_STORE })
}
