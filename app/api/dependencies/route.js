import { fetchProjectDependencies, fetchVersionDependencies } from '@/lib/dependencies'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const version = searchParams.get('version')
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 })
  try {
    const deps = version
      ? await fetchVersionDependencies(slug, version)
      : await fetchProjectDependencies(slug)
    return Response.json(deps)
  } catch {
    return Response.json({ error: 'failed to load dependencies' }, { status: 502 })
  }
}
