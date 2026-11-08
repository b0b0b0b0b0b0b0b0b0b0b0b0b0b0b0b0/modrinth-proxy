import { isSameOrigin } from '@/lib/auth'
import { countDownload } from '@/lib/downloadCounter'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 60, windowMs: 60_000 }
const MAX_BODY = 2000

export const dynamic = 'force-dynamic'

export async function POST(request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 })
  const ip = getClientIp(request)
  if (!checkRateLimit(`download-count:${ip}`, RATE_LIMIT).ok) return new Response(null, { status: 429 })

  const text = await request.text().catch(() => '')
  if (!text || text.length > MAX_BODY) return new Response(null, { status: 400 })
  let body
  try {
    body = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }

  countDownload(body?.url, ip)
  return new Response(null, { status: 204 })
}
