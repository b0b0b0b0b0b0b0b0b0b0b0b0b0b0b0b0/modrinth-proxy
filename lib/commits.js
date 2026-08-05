import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export const GITHUB_REPO = 'b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy'
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`
const GITHUB_COMMITS_URL = `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=20`

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'modrinth.black-news',
  }
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function fetchCommitsFromGitHub() {
  const res = await fetch(GITHUB_COMMITS_URL, {
    next: { revalidate: 1800 },
    headers: githubHeaders(),
  })

  if (!res.ok) {
    throw new Error(`GitHub commits ${res.status}`)
  }

  const commits = await res.json()
  if (!Array.isArray(commits)) {
    throw new Error('Invalid GitHub commits response')
  }

  return commits.slice(0, 20)
}

async function fetchCommitsFromLocalGit() {
  const { stdout } = await execFileAsync(
    'git',
    ['log', '-20', '--pretty=format:%H%x1f%an%x1f%ae%x1f%cI%x1f%B%x1e'],
    {
      cwd: process.cwd(),
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    },
  )

  return stdout
    .split('\x1e')
    .map((chunk) => chunk.replace(/^\n+|\n+$/g, ''))
    .filter(Boolean)
    .map((chunk) => {
      const [sha, name, email, date, ...messageParts] = chunk.split('\x1f')
      if (!sha || !date) return null
      return {
        sha,
        html_url: `${GITHUB_REPO_URL}/commit/${sha}`,
        author: null,
        commit: {
          message: messageParts.join('\x1f').replace(/\n+$/, ''),
          author: {
            name: name || 'unknown',
            email: email || '',
            date,
          },
        },
      }
    })
    .filter(Boolean)
}

export async function getSiteCommits() {
  try {
    return await fetchCommitsFromGitHub()
  } catch (githubError) {
    console.warn('GitHub commits unavailable, falling back to local git:', githubError.message)
    try {
      return await fetchCommitsFromLocalGit()
    } catch (gitError) {
      console.error('Local git commits fallback failed:', gitError)
      return []
    }
  }
}
