import { getSessionUser } from '@/lib/auth'
import { resolveExternalSignIn } from '@/lib/externalAccounts'
import { consumeGithubState, fetchGithubIdentity, githubAuthEnabled, redirectTo } from '@/lib/githubAuth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

export async function GET(request) {
  if (!githubAuthEnabled()) return redirectTo('/login?error=github')

  const ip = getClientIp(request)
  const rate = checkRateLimit(`auth-github-callback:${ip}`, RATE_LIMIT)
  if (!rate.ok) return redirectTo('/login?error=rate_limit')

  const params = new URL(request.url).searchParams
  const pending = consumeGithubState(params.get('state'))
  const code = params.get('code')
  if (!pending || !code) return redirectTo('/login?error=github')

  const identity = await fetchGithubIdentity(code)
  if (!identity) return redirectTo('/login?error=github')

  const result = resolveExternalSignIn('github', identity, {
    currentUser: getSessionUser(),
    ip,
    next: pending.next,
  })

  if (result === 'linked') return redirectTo('/account?tab=signin')
  if (result === 'taken') return redirectTo('/account?tab=signin&taken=github')
  if (result === 'session') return redirectTo(pending.next || '/account')
  if (result === 'held') {
    return redirectTo(pending.next ? `/login?next=${encodeURIComponent(pending.next)}` : '/login')
  }
  if (result === 'signup_limit') return redirectTo('/login?error=signup_limit')
  return redirectTo('/login?error=github')
}
