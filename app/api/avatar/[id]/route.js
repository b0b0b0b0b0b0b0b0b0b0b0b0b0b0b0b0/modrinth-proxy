import { cachedHead, minecraftHead, normalizeHeadId } from '@/lib/minecraftHead'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const RENDER_LIMIT = { limit: 60, windowMs: 60_000 }

export async function GET(request, { params }) {
  const { id } = await params
  const uuid = normalizeHeadId(id)
  if (!uuid) return new Response(null, { status: 404 })

  if (!cachedHead(uuid) && !checkRateLimit(`mc-head:${getClientIp(request)}`, RENDER_LIMIT).ok) {
    return new Response(null, { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } })
  }

  const png = await minecraftHead(uuid)
  if (!png) return new Response(null, { status: 502, headers: { 'Cache-Control': 'no-store' } })

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=21600, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
