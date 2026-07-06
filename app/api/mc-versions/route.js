import { getMinecraftVersions } from '@/lib/modrinth'

class MinecraftVersions {
  constructor(data) {
    if (Array.isArray(data)) {
      this.release = data.filter(v => v.version_type === 'release').map(v => v.version)
      this.full = data.map(v => v.version)
    } else {
      this.release = data.release || []
      this.full = data.full || []
    }
  }
  getRelease() {
    return [...this.release]
  }
  getFull() {
    return [...this.full]
  }
}

let cachedVersions = null
let cacheTimestamp = 0
const CACHE_DURATION = 86400000

export async function GET() {
  const now = Date.now()
  if (cachedVersions && (now - cacheTimestamp) < CACHE_DURATION) {
    return Response.json(cachedVersions, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400'
      }
    })
  }
  try {
    const apiVersions = await getMinecraftVersions()
    const versions = new MinecraftVersions(apiVersions)
    const result = {
      release: versions.getRelease(),
      full: versions.getFull()
    }
    cachedVersions = result
    cacheTimestamp = now
    return Response.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Failed to get Minecraft versions:', error)
    if (cachedVersions) {
      return Response.json(cachedVersions, {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400'
        }
      })
    }
    return Response.json(
      { release: [], full: [] },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    )
  }
}
