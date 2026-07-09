import { downloadDependencyResolver } from '@/lib/downloadDependencies'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }
  const { dependencies, loader, gameVersion } = body || {}
  if (!loader || !gameVersion) return Response.json({ error: 'loader and gameVersion required' }, { status: 400 })
  if (!Array.isArray(dependencies)) return Response.json({ error: 'dependencies required' }, { status: 400 })
  try {
    const [tree, files] = await Promise.all([
      downloadDependencyResolver.resolveTree(dependencies, { loader, gameVersion }),
      downloadDependencyResolver.resolve(dependencies, { loader, gameVersion }),
    ])
    return Response.json({ tree, files }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return Response.json({ error: 'failed to resolve dependencies' }, { status: 502 })
  }
}
