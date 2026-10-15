import { getSessionUser, isSameOrigin } from '@/lib/auth'
import { clearNotifyMutes, isGameLoader, isGameVersion, setAccountPreference, setGameProfile } from '@/lib/account'
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
  const hasLoader = body?.gameLoader !== undefined
  const hasGameVersion = body?.gameVersion !== undefined
  if (hasLoader && body.gameLoader !== '' && !isGameLoader(body.gameLoader)) {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }
  if (hasGameVersion && body.gameVersion !== '' && !isGameVersion(body.gameVersion)) {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }
  if (booleans.length === 0 && !unmuteAll && !hasLoader && !hasGameVersion) {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }
  if (hasLoader || hasGameVersion) {
    setGameProfile(user.id, {
      loader: hasLoader ? body.gameLoader : undefined,
      gameVersion: hasGameVersion ? body.gameVersion : undefined,
    })
  }

  for (const [key, value] of booleans) {
    if (key === 'telegram') setTelegramNotify(user.id, value, getRequestLocale())
    else setAccountPreference(user.id, key, value)
  }
  if (unmuteAll) clearNotifyMutes(user.id)
  return Response.json({ ok: true })
}
