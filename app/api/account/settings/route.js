import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { clearNotifyMutes, setAccountPreference } from '@/lib/account'
import { getRequestLocale } from '@/lib/i18n/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { setTelegramNotify } from '@/lib/telegramBot'

const RATE_LIMIT = { limit: 30, windowMs: 10 * 60 * 1000 }

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const user = getSessionUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rate = checkRateLimit(`account-settings:${user.id}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const body = await request.json().catch(() => null)
  const changes = {
    telegram: body?.telegram,
    trackDownloads: body?.trackDownloads,
    recordHistory: body?.recordHistory,
  }
  const booleans = Object.entries(changes).filter(([, value]) => typeof value === 'boolean')
  const unmuteAll = body?.unmuteAll === true
  if (booleans.length === 0 && !unmuteAll) return Response.json({ error: 'bad_request' }, { status: 400 })

  for (const [key, value] of booleans) {
    if (key === 'telegram') setTelegramNotify(user.id, value, getRequestLocale())
    else setAccountPreference(user.id, key, value)
  }
  if (unmuteAll) clearNotifyMutes(user.id)
  return Response.json({ ok: true })
}
