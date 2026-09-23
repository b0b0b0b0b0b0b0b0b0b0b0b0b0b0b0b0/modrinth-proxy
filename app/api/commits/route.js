import { getSiteCommits } from '@/lib/commits'
import { SITE_VERSION } from '@/lib/siteVersion'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const commits = await getSiteCommits()
    if (!Array.isArray(commits) || commits.length === 0) {
      return Response.json({ error: 'Failed to fetch commits' }, { status: 500 })
    }
    return Response.json(commits, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Site-Version': String(SITE_VERSION),
      },
    })
  } catch (error) {
    console.error('Error fetching commits:', error)
    return Response.json({ error: 'Failed to fetch commits' }, { status: 500 })
  }
}
