import { getSessionUser, startSession } from '@/lib/auth'
import { recordSignup, signupAllowed } from '@/lib/captcha'
import {
  consumeGithubState,
  fetchGithubIdentity,
  findUserByGithubId,
  githubAuthEnabled,
  githubUsername,
  holdGithubIdentity,
  linkGithub,
  redirectTo,
  registerGithubUser,
  usernameTaken,
} from '@/lib/githubAuth'
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

  const current = getSessionUser()
  if (current) {
    return redirectTo(linkGithub(current.id, identity.id) ? '/account' : '/account?github=taken')
  }

  let user = findUserByGithubId(identity.id)
  if (!user) {
    if (usernameTaken(githubUsername(identity.login))) {
      holdGithubIdentity(identity, pending.next)
      return redirectTo(pending.next ? `/login?next=${encodeURIComponent(pending.next)}` : '/login')
    }
    if (!signupAllowed(ip)) return redirectTo('/login?error=signup_limit')
    user = registerGithubUser(identity.id, identity.login)
    if (!user) return redirectTo('/login?error=github')
    recordSignup(ip)
  }

  startSession(user.id)
  return redirectTo(pending.next || '/account')
}
