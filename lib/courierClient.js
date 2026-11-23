const COURIER_TIMEOUT_MS = 12000
const PROJECT_ROUTE_RE = /^\/(?:mod|plugin|datapack|resourcepack|shader|modpack|project)\/([^/?#]+)/

export function projectSlugFrom(pathname) {
  const match = PROJECT_ROUTE_RE.exec(pathname || '')
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(COURIER_TIMEOUT_MS) })
  return response.ok ? response.json() : null
}

export async function deliverProject(slug, { project = null, withVersions = true } = {}) {
  const base = `https://api.modrinth.com/v2/project/${encodeURIComponent(slug)}`
  const ownProject = project?.id ? project : await fetchJson(base)
  if (!ownProject?.id) return false
  const [versions, members, organization] = await Promise.all([
    withVersions ? fetchJson(`${base}/version`).catch(() => null) : null,
    fetchJson(`${base}/members`).catch(() => null),
    ownProject.organization
      ? fetchJson(`https://api.modrinth.com/v3/organization/${encodeURIComponent(ownProject.organization)}`).catch(() => null)
      : null,
  ])
  const response = await fetch('/api/courier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, project: ownProject, versions, members, organization }),
  })
  return response.ok
}
