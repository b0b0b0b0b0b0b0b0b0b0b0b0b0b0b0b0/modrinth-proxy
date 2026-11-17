import { fetchProjectDependencies, fetchVersionDependencies } from '@/lib/dependencies'
import { rateLimitResponse } from '@/lib/rateLimit'

const SLUG_RE = /^[\w!@$()`.+,"\-']{1,64}$/

export async function GET(request) {
  const limited = rateLimitResponse(request, 'deps-list', { limit: 120 })
  if (limited) return limited
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const version = searchParams.get('version')
  if (!slug || !SLUG_RE.test(slug)) return Response.json({ error: 'slug required' }, { status: 400 })
  if (version && version.length > 128) return Response.json({ error: 'bad version' }, { status: 400 })
  try {
    const deps = version
      ? await fetchVersionDependencies(slug, version)
      : await fetchProjectDependencies(slug)
    return Response.json(deps)
  } catch {
    return Response.json({ error: 'failed to load dependencies' }, { status: 502 })
  }
}
