import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { isSameOrigin } from '@/lib/auth'
import { COURIER_COOKIE, COURIER_TTL_MS, putCourierDelivery } from '@/lib/courierStore'
import { MODRINTH_API, MODRINTH_SERVER_API } from '@/lib/modrinth'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const RATE_LIMIT = { limit: 20, windowMs: 60_000 }
const MAX_BYTES = 8 * 1024 * 1024
const MAX_VERSIONS = 5000
const MAX_MEMBERS = 500
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

function validMembers(members, teamId) {
  return (
    Array.isArray(members) &&
    members.length > 0 &&
    members.length <= MAX_MEMBERS &&
    members.every((member) => member && typeof member === 'object' && member.team_id === teamId && typeof member.user?.id === 'string')
  )
}

function validOrganization(organization, organizationId) {
  return (
    Boolean(organization) &&
    typeof organization === 'object' &&
    !Array.isArray(organization) &&
    typeof organizationId === 'string' &&
    organization.id === organizationId &&
    (organization.members === undefined || validMembers(organization.members, organization.team_id))
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

  const cookieStore = await cookies()
  let token = cookieStore.get(COURIER_COOKIE)?.value
  if (!token || !/^[\w-]{16,64}$/.test(token)) {
    token = randomBytes(18).toString('base64url')
  }
  cookieStore.set(COURIER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(COURIER_TTL_MS / 1000),
  })

  const items = [{ url: `${MODRINTH_API}/project/${encodeURIComponent(slug)}`, data: body.project, size: JSON.stringify(body.project).length }]
  if (validVersions(body.versions, body.project.id)) {
    items.push({ url: `${MODRINTH_API}/project/${encodeURIComponent(slug)}/version`, data: body.versions, size: JSON.stringify(body.versions).length })
  }
  if (validMembers(body.members, body.project.team)) {
    items.push({ url: `${MODRINTH_API}/project/${encodeURIComponent(slug)}/members`, data: body.members, size: JSON.stringify(body.members).length })
  }
  if (validOrganization(body.organization, body.project.organization)) {
    items.push({
      url: `${MODRINTH_SERVER_API}/organization/${encodeURIComponent(body.project.organization)}`,
      data: body.organization,
      size: JSON.stringify(body.organization).length,
    })
  }
  if (!putCourierDelivery(token, slug, items)) return Response.json({ error: 'too_large' }, { status: 413 })

  return Response.json({ ok: true })
}
