import { getSessionUser } from '@/lib/auth'
import { resolveExternalSignIn } from '@/lib/externalAccounts'
import { consumeDiscordState, discordAuthEnabled, fetchDiscordIdentity } from '@/lib/discordAuth'
import { joinDiscordGuild } from '@/lib/discordBot'
import { redirectTo } from '@/lib/githubAuth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

export async function GET(request) {
  if (!discordAuthEnabled()) return redirectTo('/login?error=discord')

  const ip = getClientIp(request)
  const rate = checkRateLimit(`auth-discord-callback:${ip}`, RATE_LIMIT)
  if (!rate.ok) return redirectTo('/login?error=rate_limit')

  const params = new URL(request.url).searchParams
  const pending = await consumeDiscordState(params.get('state'))
  const code = params.get('code')
  if (!pending || !code) return redirectTo('/login?error=discord')
  const fail = (error) => redirectTo(`/login?error=${error}${pending.next ? `&next=${encodeURIComponent(pending.next)}` : ''}`)

  const identity = await fetchDiscordIdentity(code)
  if (!identity) return fail('discord')

  const result = await resolveExternalSignIn('discord', identity, {
    currentUser: await getSessionUser(),
    ip,
    next: pending.next,
  })
  if (result === 'linked' || result === 'session') await joinDiscordGuild(identity.id, identity.accessToken)

  if (result === 'linked') return redirectTo('/settings/security')
  if (result === 'taken') return redirectTo('/settings/security?taken=discord')
  if (result === 'session') return redirectTo(pending.next || '/account')
  if (result === 'held') {
    return redirectTo(pending.next ? `/login?next=${encodeURIComponent(pending.next)}` : '/login')
  }
  if (result === 'signup_limit') return fail('signup_limit')
  return fail('discord')
}
