import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { AccountFestiveScore } from '@/lib/festiveScore'
import { checkRateLimit } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 180, windowMs: 60 * 1000 }

export const dynamic = 'force-dynamic'

function snapshot(userId) {
  const score = new AccountFestiveScore()
  return { account: userId, ...score.read(userId) }
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const rate = checkRateLimit(`festive-read:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })
  return Response.json(snapshot(user.id))
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const rate = checkRateLimit(`festive-absorb:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })
  const parsed = AccountFestiveScore.validReport(await request.json().catch(() => null))
  if (!parsed) return Response.json({ error: 'bad_request' }, { status: 400 })
  return Response.json(new AccountFestiveScore().absorb(user.id, parsed.deviceId, parsed.report))
}
