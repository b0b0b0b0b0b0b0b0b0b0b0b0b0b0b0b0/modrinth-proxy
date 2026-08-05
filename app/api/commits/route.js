import { getSiteCommits } from '@/lib/commits'

export const revalidate = 1800

export async function GET() {
  try {
    const commits = await getSiteCommits()
    if (!Array.isArray(commits) || commits.length === 0) {
      return Response.json({ error: 'Failed to fetch commits' }, { status: 500 })
    }
    return Response.json(commits, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching commits:', error)
    return Response.json({ error: 'Failed to fetch commits' }, { status: 500 })
  }
}
