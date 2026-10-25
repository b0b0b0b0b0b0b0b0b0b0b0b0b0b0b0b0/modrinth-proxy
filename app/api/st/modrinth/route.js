import { getSessionUser } from '@/lib/auth'
import { getModrinthTraffic } from '@/lib/modrinthTraffic'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!getSessionUser()) return new Response(null, { status: 404 })
  return Response.json(getModrinthTraffic(), { headers: { 'Cache-Control': 'no-store' } })
}
