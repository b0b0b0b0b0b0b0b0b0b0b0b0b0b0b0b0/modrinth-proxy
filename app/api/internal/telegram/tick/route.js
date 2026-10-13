import { timingSafeEqual } from 'crypto'
import { telegramTick } from '@/lib/telegramBot'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const expected = Buffer.from(String(globalThis.__internalKey || ''))
  const actual = Buffer.from(request.headers.get('x-internal-key') || '')
  if (expected.length === 0 || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return new Response(null, { status: 404 })
  }
  return Response.json({ ok: await telegramTick() })
}
