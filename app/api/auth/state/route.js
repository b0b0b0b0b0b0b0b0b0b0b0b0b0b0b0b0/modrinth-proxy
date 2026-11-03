import { ensureSsoCookie, getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  await ensureSsoCookie()
  const user = await getSessionUser()
  return Response.json({ id: user?.id ?? null }, { headers: { 'Cache-Control': 'private, no-store' } })
}
