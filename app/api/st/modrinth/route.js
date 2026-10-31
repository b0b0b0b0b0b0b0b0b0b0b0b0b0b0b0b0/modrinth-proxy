import { isAdmin } from '@/lib/admins'
import { getSessionUser } from '@/lib/auth'
import { getModrinthTrafficReport } from '@/lib/modrinthTrafficReport'

export const dynamic = 'force-dynamic'

function timeParam(value) {
  const n = Number(value)
  return value && Number.isFinite(n) ? n : null
}

export async function GET(request) {
  if (!isAdmin(getSessionUser())) return new Response(null, { status: 404 })
  const params = new URL(request.url).searchParams
  const report = getModrinthTrafficReport({ from: timeParam(params.get('from')), to: timeParam(params.get('to')) })
  return Response.json(report, { headers: { 'Cache-Control': 'no-store' } })
}
