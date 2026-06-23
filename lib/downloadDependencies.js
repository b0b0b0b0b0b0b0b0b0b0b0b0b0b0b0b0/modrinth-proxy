const MODRINTH_API = 'https://api.modrinth.com/v2'

class ModrinthHttpClient {
  constructor(userAgent) {
    this.userAgent = userAgent
  }

  async getJson(url) {
    const response = await fetch(url, {
      headers: { 'User-Agent': this.userAgent },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return null
    return response.json()
  }
}

class VersionPrimaryFile {
  static fromVersion(version) {
    if (!version?.files?.length) return null
    const file = version.files.find((entry) => entry.primary) || version.files[0]
    if (!file?.url || !file?.filename) return null
    return {
      filename: file.filename,
      url: file.url,
      versionId: version.id,
      projectId: version.project_id,
      label: version.name || version.version_number || file.filename,
    }
  }
}

export class DownloadDependencyResolver {
  constructor(options = {}) {
    this.client = new ModrinthHttpClient(options.userAgent || 'ModrinthProxyExample/1.0')
    this.supportedTypes = ['required', 'optional', 'embedded']
  }

  async resolve(rawDependencies, { loader, gameVersion }) {
    const typeOrder = { required: 0, optional: 1, embedded: 2 }
    const relevant = (rawDependencies || [])
      .filter((dep) => this.supportedTypes.includes(dep.dependency_type))
      .sort((a, b) => typeOrder[a.dependency_type] - typeOrder[b.dependency_type])

    if (relevant.length === 0) return []

    const versionIds = [...new Set(relevant.map((dep) => dep.version_id).filter(Boolean))]
    const projectIds = [
      ...new Set(
        relevant.filter((dep) => !dep.version_id && dep.project_id).map((dep) => dep.project_id),
      ),
    ]

    const [pinnedVersions, resolvedVersions] = await Promise.all([
      this.loadVersionsByIds(versionIds),
      this.loadLatestProjectVersions(projectIds, loader, gameVersion),
    ])

    const pinnedById = new Map(pinnedVersions.map((version) => [version.id, version]))
    const resolvedByProject = new Map(resolvedVersions.map((version) => [version.project_id, version]))

    const files = []
    const seen = new Set()

    for (const dep of relevant) {
      const dedupeKey = dep.version_id || dep.project_id
      if (!dedupeKey || seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      const version = dep.version_id
        ? pinnedById.get(dep.version_id)
        : resolvedByProject.get(dep.project_id)

      const file = VersionPrimaryFile.fromVersion(version)
      if (file) {
        files.push({
          ...file,
          dependencyType: dep.dependency_type,
        })
      }
    }

    if (files.length === 0) return []

    const titles = await this.loadProjectTitles([...new Set(files.map((file) => file.projectId).filter(Boolean))])

    return files.map((file) => ({
      ...file,
      title: titles.get(file.projectId) || file.label,
    }))
  }

  async loadVersionsByIds(ids) {
    if (ids.length === 0) return []
    const chunkSize = 100
    const versions = []
    for (let offset = 0; offset < ids.length; offset += chunkSize) {
      const chunk = ids.slice(offset, offset + chunkSize)
      const payload = await this.client.getJson(
        `${MODRINTH_API}/versions?ids=${encodeURIComponent(JSON.stringify(chunk))}`,
      )
      if (Array.isArray(payload)) versions.push(...payload)
    }
    return versions
  }

  async loadLatestProjectVersions(projectIds, loader, gameVersion) {
    if (projectIds.length === 0 || !loader || !gameVersion) return []
    const results = await Promise.all(
      projectIds.map((projectId) => this.loadLatestProjectVersion(projectId, loader, gameVersion)),
    )
    return results.filter(Boolean)
  }

  async loadLatestProjectVersion(projectId, loader, gameVersion) {
    const params = new URLSearchParams()
    params.set('loaders', JSON.stringify([loader]))
    params.set('game_versions', JSON.stringify([gameVersion]))
    params.set('limit', '1')
    const payload = await this.client.getJson(
      `${MODRINTH_API}/project/${projectId}/version?${params}`,
    )
    return Array.isArray(payload) && payload.length > 0 ? payload[0] : null
  }

  async loadProjectTitles(projectIds) {
    const titles = new Map()
    if (projectIds.length === 0) return titles

    const chunkSize = 100
    for (let offset = 0; offset < projectIds.length; offset += chunkSize) {
      const chunk = projectIds.slice(offset, offset + chunkSize)
      const payload = await this.client.getJson(
        `${MODRINTH_API}/projects?ids=${encodeURIComponent(JSON.stringify(chunk))}`,
      )
      if (!Array.isArray(payload)) continue
      for (const project of payload) {
        titles.set(project.id, project.name || project.title)
      }
    }

    return titles
  }
}

export const downloadDependencyResolver = new DownloadDependencyResolver()
