import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { isSameOrigin } from '@/lib/auth'
import { COURIER_COOKIE, COURIER_TTL_MS, putCourier } from '@/lib/courierStore'
import { MODRINTH_API } from '@/lib/modrinth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 20, windowMs: 60_000 }
const MAX_BYTES = 8 * 1024 * 1024
const MAX_VERSIONS = 5000
const SLUG_RE = /^[\w!@$()`.+,"\-']{1,64}$/

export const dynamic = 'force-dynamic'

function sameProject(slug, project) {
  if (!project || typeof project !== 'object' || Array.isArray(project)) return false
  if (typeof project.id !== 'string' || typeof project.slug !== 'string') return false
  return project.slug.toLowerCase() === slug.toLowerCase() || project.id === slug
}

function validVersions(versions, projectId) {
  return (
    Array.isArray(versions) &&
    versions.length <= MAX_VERSIONS &&
    versions.every((version) => version && typeof version === 'object' && version.project_id === projectId)
  )
}

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }

  const rate = checkRateLimit(`courier:${getClientIp(request)}`, RATE_LIMIT)
  if (!rate.ok) return Response.json({ error: 'rate_limit' }, { status: 429 })

  const length = Number(request.headers.get('content-length') || 0)
  if (length > MAX_BYTES) return Response.json({ error: 'too_large' }, { status: 413 })
  const text = await request.text().catch(() => '')
  if (!text || text.length > MAX_BYTES) return Response.json({ error: 'bad_request' }, { status: 400 })

  let body
  try {
    body = JSON.parse(text)
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }

  const slug = typeof body?.slug === 'string' ? body.slug : ''
  if (!SLUG_RE.test(slug) || !sameProject(slug, body.project)) {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }

  let token = cookies().get(COURIER_COOKIE)?.value
  if (!token || !/^[\w-]{16,64}$/.test(token)) {
    token = randomBytes(18).toString('base64url')
  }
  cookies().set(COURIER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(COURIER_TTL_MS / 1000),
  })

  putCourier(token, `${MODRINTH_API}/project/${slug}`, body.project)
  if (validVersions(body.versions, body.project.id)) {
    putCourier(token, `${MODRINTH_API}/project/${slug}/version`, body.versions)
  }

  return Response.json({ ok: true })
}
