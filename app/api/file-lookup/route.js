import { getMod, getVersionFromFileHash } from '@/lib/modrinth'

const HASH_LENGTH = {
  sha1: 40,
  sha256: 64,
  sha512: 128,
}

function isValidHash(hash, algorithm) {
  const expected = HASH_LENGTH[algorithm]
  if (!expected) return false
  return /^[a-f0-9]+$/i.test(hash) && hash.length === expected
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const hash = searchParams.get('hash')?.trim()
  const algorithm = (searchParams.get('algorithm') || 'sha512').trim().toLowerCase()

  if (!hash || !isValidHash(hash, algorithm)) {
    return Response.json({ error: 'Invalid hash' }, { status: 400 })
  }

  try {
    const version = await getVersionFromFileHash(hash, algorithm)
    if (!version) {
      return Response.json({ error: 'not_found' }, { status: 404 })
    }

    const project = await getMod(version.project_id)
    if (!project) {
      return Response.json({ error: 'project_not_found' }, { status: 404 })
    }

    return Response.json({
      version: {
        id: version.id,
        project_id: version.project_id,
        version_number: version.version_number,
        name: version.name,
        version_type: version.version_type,
        game_versions: version.game_versions,
        loaders: version.loaders,
        downloads: version.downloads,
        files: version.files,
      },
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        project_type: project.project_type,
        icon_url: project.icon_url,
      },
    })
  } catch (error) {
    console.error('File lookup failed:', error)
    return Response.json({ error: 'lookup_failed' }, { status: 502 })
  }
}
