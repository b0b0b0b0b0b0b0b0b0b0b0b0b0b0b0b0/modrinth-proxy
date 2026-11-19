import { timingSafeEqual } from 'crypto'
import { discordFeedTick } from '@/lib/discordFeed'
import { notifyTick } from '@/lib/updateNotifier'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const expected = Buffer.from(String(globalThis.__internalKey || ''))
  const actual = Buffer.from(request.headers.get('x-internal-key') || '')
  if (expected.length === 0 || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return new Response(null, { status: 404 })
  }
  const [ok] = await Promise.all([notifyTick(), discordFeedTick()])
  return Response.json({ ok })
}
