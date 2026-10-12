import { getFavoriteCounts } from '@/lib/account'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const ids = (new URL(request.url).searchParams.get('ids') || '').split(',').slice(0, 100)
  return Response.json(getFavoriteCounts(ids))
}
