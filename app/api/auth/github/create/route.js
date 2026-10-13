import { isSameOrigin, startSession } from '@/lib/auth'
import { recordSignup, signupAllowed } from '@/lib/captcha'
import {
  findUserByGithubId,
  heldGithubIdentity,
  registerGithubUser,
  releaseGithubIdentity,
} from '@/lib/githubAuth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })

  const ip = getClientIp(request)
  const rate = checkRateLimit(`auth-github-create:${ip}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const held = heldGithubIdentity()
  if (!held) return Response.json({ error: 'github' }, { status: 400 })

  let user = findUserByGithubId(held.id)
  if (!user) {
    if (!signupAllowed(ip)) return Response.json({ error: 'signup_limit' }, { status: 429 })
    user = registerGithubUser(held.id, held.login)
    if (!user) return Response.json({ error: 'github' }, { status: 500 })
    recordSignup(ip)
  }

  releaseGithubIdentity()
  startSession(user.id)
  return Response.json({ user: { username: user.username } })
}
