import { beginGithubAuth, githubAuthEnabled, redirectTo } from '@/lib/githubAuth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 }

export async function GET(request) {
  if (!githubAuthEnabled()) return redirectTo('/login?error=github')

  const rate = checkRateLimit(`auth-github:${getClientIp(request)}`, RATE_LIMIT)
  if (!rate.ok) return redirectTo('/login?error=rate_limit')

  return redirectTo(beginGithubAuth(new URL(request.url).searchParams.get('next')))
}
