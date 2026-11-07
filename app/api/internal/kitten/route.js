import { getUserBySessionToken } from '@/lib/auth'
import { isInternalRequest } from '@/lib/internalApi'
import { addKittenPets, isGrumpyKitten, readKittenPets } from '@/lib/kittenPets'
import { kittenProgress } from '@/lib/kittenLevels'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isInternalRequest(request)) return new Response(null, { status: 404 })
  const body = await request.json().catch(() => null)
  const user = getUserBySessionToken(body?.token)
  if (!user) return Response.json({ pets: null })
  const pets = body?.add ? addKittenPets(user.id, body.add) : readKittenPets(user.id)
  const grumpy = isGrumpyKitten(user.id)
  return Response.json({ ...kittenProgress(pets), name: user.username, ...(grumpy && { grumpy }) })
}
