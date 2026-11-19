import { beginDiscordAuth, discordAuthEnabled } from '@/lib/discordAuth'
import { redirectTo } from '@/lib/githubAuth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

export async function GET(request) {
  if (!discordAuthEnabled()) return redirectTo('/login?error=discord')

  const rate = checkRateLimit(`auth-discord:${getClientIp(request)}`, RATE_LIMIT)
  if (!rate.ok) return redirectTo('/login?error=rate_limit')

  return redirectTo(await beginDiscordAuth(new URL(request.url).searchParams.get('next')))
}
