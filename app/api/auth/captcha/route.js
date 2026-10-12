import { createCaptcha } from '@/lib/captcha'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 40, windowMs: 60_000 }

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const ip = getClientIp(request)
  const rate = checkRateLimit(`auth-captcha:${ip}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const captcha = createCaptcha(new URL(request.url).searchParams.get('mode'), ip)
  if (!captcha) return Response.json({ error: 'bad_request' }, { status: 400 })
  return Response.json(captcha, { headers: { 'Cache-Control': 'no-store' } })
}
