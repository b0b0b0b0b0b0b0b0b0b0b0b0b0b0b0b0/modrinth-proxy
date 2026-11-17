import { MODRINTH_API, MODRINTH_USER_AGENT } from './modrinth'
import { filterNestedDependencies } from './dependencies'

function gameVersionMinorPrefix(versionString) {
  const match = /^(\d+\.\d+)/.exec(String(versionString).trim())
  return match ? match[1] : null
}

function versionSupportsGameVersion(version, targetGameVersion) {
  const gameVersions = version?.game_versions
  if (!Array.isArray(gameVersions) || gameVersions.length === 0) return true
  if (gameVersions.includes(targetGameVersion)) return true

  const targetMinor = gameVersionMinorPrefix(targetGameVersion)
  if (!targetMinor) return false

  return gameVersions.some((gameVersion) => gameVersionMinorPrefix(gameVersion) === targetMinor)
}

const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_MAX_BYTES = 32 * 1024 * 1024
const GLOBAL_WINDOW_MS = 60_000
const GLOBAL_CALLS_PER_WINDOW = 120
const GLOBAL_IN_FLIGHT = 8

const shared = (globalThis.__depResolverShared ??= {
  cache: new Map(),
  cacheBytes: 0,
  window: { start: 0, used: 0 },
  inFlight: 0,
  waiters: [],
})

function cacheGet(url) {
  const entry = shared.cache.get(url)
  if (!entry) return undefined
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    shared.cache.delete(url)
    shared.cacheBytes -= entry.size
    return undefined
  }
  shared.cache.delete(url)
  shared.cache.set(url, entry)
  return entry.data
}

function cacheSet(url, data, size) {
  if (size > CACHE_MAX_BYTES / 8) return
  const old = shared.cache.get(url)
  if (old) {
    shared.cache.delete(url)
    shared.cacheBytes -= old.size
  }
  shared.cache.set(url, { at: Date.now(), data, size })
  shared.cacheBytes += size
  while (shared.cacheBytes > CACHE_MAX_BYTES && shared.cache.size > 0) {
    const [key, entry] = shared.cache.entries().next().value
    shared.cache.delete(key)
    shared.cacheBytes -= entry.size
  }
}

function takeGlobalCall() {
  const now = Date.now()
  if (now - shared.window.start >= GLOBAL_WINDOW_MS) shared.window = { start: now, used: 0 }
  if (shared.window.used >= GLOBAL_CALLS_PER_WINDOW) return false
  shared.window.used += 1
  return true
}

async function acquireSlot() {
  if (shared.inFlight < GLOBAL_IN_FLIGHT) {
    shared.inFlight += 1
    return
  }
  await new Promise((resolve) => shared.waiters.push(resolve))
}

function releaseSlot() {
  const next = shared.waiters.shift()
  if (next) next()
  else shared.inFlight -= 1
}

class ModrinthHttpClient {
  constructor(userAgent, maxCalls = Number.POSITIVE_INFINITY) {
    this.userAgent = userAgent
    this.callsLeft = maxCalls
  }

  async getJson(url) {
    const cached = cacheGet(url)
    if (cached !== undefined) return cached
    if (this.callsLeft <= 0 || !takeGlobalCall()) {
      this.truncated = true
      return null
    }
    this.callsLeft -= 1
    await acquireSlot()
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(15000),
        cache: 'no-store',
      })
      if (!response.ok) return null
      const text = await response.text()
      const data = JSON.parse(text)
      cacheSet(url, data, text.length)
      return data
    } catch {
      return null
    } finally {
      releaseSlot()
    }
  }
}

class VersionPrimaryFile {
  static fromVersion(version, preferredFilename) {
    if (!version?.files?.length) return null
    const file = preferredFilename
      ? version.files.find((entry) => entry.filename === preferredFilename)
      : null
    const resolved = file || version.files.find((entry) => entry.primary) || version.files[0]
    if (!resolved?.url || !resolved?.filename) return null
    return {
      filename: resolved.filename,
      url: resolved.url,
      versionId: version.id,
      projectId: version.project_id,
      label: version.name || version.version_number || resolved.filename,
      versionNumber: version.version_number || null,
    }
  }
}

export class DownloadDependencyResolver {
  constructor(options = {}) {
    this.client = new ModrinthHttpClient(options.userAgent || MODRINTH_USER_AGENT, options.maxUpstreamCalls)
    this.supportedTypes = ['required', 'optional', 'embedded']
    this.displayMaxNestingDepth = 1
    this.fullMaxNestingDepth = options.maxDepth ?? 8
    this.concurrency = options.concurrency ?? 6
  }

  async resolve(rawDependencies, { loader, gameVersion }) {
    const tree = await this.resolveTree(rawDependencies, {
      loader,
      gameVersion,
      maxDepth: this.fullMaxNestingDepth,
    })
    return this.flattenTreeDeduped(tree)
  }

  async resolveTree(rawDependencies, { loader, gameVersion, maxDepth = this.displayMaxNestingDepth }) {
    const typeOrder = { required: 0, optional: 1, embedded: 2 }
    const relevant = (rawDependencies || [])
      .filter((dep) => this.supportedTypes.includes(dep.dependency_type))
      .sort((a, b) => typeOrder[a.dependency_type] - typeOrder[b.dependency_type])

    if (relevant.length === 0) return []

    const context = await this.buildResolveContext(relevant, { loader, gameVersion })
    const topItems = await this.resolveDependencyRows(relevant, context)
    const topProjectIds = new Set(topItems.map((item) => item.projectId).filter(Boolean))

    const expanded = new Set()
    const tree = []
    for (const item of topItems) {
      const children = await this.resolveChildNodes(item, {
        loader,
        gameVersion,
        rootProjectIds: topProjectIds,
        ancestorProjectIds: [],
        maxDepth,
        currentDepth: 0,
        expanded,
      })
      tree.push({ ...item, children })
    }

    return tree
  }

  trimTree(tree, depth = this.displayMaxNestingDepth) {
    return tree.map((node) => ({
      ...node,
      children: depth > 0 ? this.trimTree(node.children || [], depth - 1) : [],
    }))
  }

  flattenTree(tree) {
    const flat = []
    const walk = (nodes) => {
      for (const node of nodes) {
        const { children, ...item } = node
        flat.push(item)
        walk(children || [])
      }
    }
    walk(tree)
    return flat
  }

  flattenTreeDeduped(tree) {
    const flat = []
    const seen = new Set()
    const walk = (nodes) => {
      for (const node of nodes) {
        const { children, ...item } = node
        const key = item.projectId || item.versionId || item.filename
        if (!seen.has(key)) {
          seen.add(key)
          flat.push(item)
        }
        walk(children || [])
      }
    }
    walk(tree)
    return flat
  }

  async resolveChildNodes(
    item,
    { loader, gameVersion, rootProjectIds, ancestorProjectIds, maxDepth, currentDepth, expanded },
  ) {
    if (currentDepth >= maxDepth) return []
    if (!item.versionId || (currentDepth > 0 && expanded.has(item.versionId))) return []
    expanded.add(item.versionId)

    const version = await this.loadVersionRecord(item.versionId)
    if (!version?.dependencies?.length) return []

    const nestedDeps = filterNestedDependencies(version.dependencies, {
      rootProjectIds: [...rootProjectIds],
      ancestorIds: ancestorProjectIds,
      selfProjectId: item.projectId || null,
    })
    if (nestedDeps.length === 0) return []

    const nestedContext = await this.buildResolveContext(nestedDeps, { loader, gameVersion })
    const rows = await this.resolveDependencyRows(nestedDeps, nestedContext)

    const nextAncestors = item.projectId
      ? [...ancestorProjectIds, item.projectId]
      : ancestorProjectIds

    const children = []
    for (const row of rows) {
      const grandchildren =
        currentDepth + 1 < maxDepth
          ? await this.resolveChildNodes(row, {
              loader,
              gameVersion,
              rootProjectIds,
              ancestorProjectIds: nextAncestors,
              maxDepth,
              currentDepth: currentDepth + 1,
              expanded,
            })
          : []
      children.push({ ...row, children: grandchildren })
    }

    return children
  }

  async loadVersionRecord(versionId) {
    const loaded = await this.loadVersionsByIds([versionId])
    return loaded[0] || null
  }

  async buildResolveContext(relevant, { loader, gameVersion }) {
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

    return {
      pinnedById: new Map(pinnedVersions.map((version) => [version.id, version])),
      resolvedByProject: new Map(resolvedVersions.map((version) => [version.project_id, version])),
      projectMeta: await this.loadProjectMeta([
        ...new Set([
          ...projectIds,
          ...pinnedVersions.map((version) => version.project_id),
          ...resolvedVersions.map((version) => version.project_id),
        ].filter(Boolean)),
      ]),
    }
  }

  async resolveDependencyRows(deps, context, seen = new Set()) {
    const files = []

    for (const dep of deps) {
      const dedupeKey = dep.version_id || dep.project_id || dep.file_name
      if (!dedupeKey || seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      const file = this.resolveDependencyFile(dep, context)
      if (!file) continue

      const meta = file.projectId ? context.projectMeta.get(file.projectId) : null
      const versionLabel = this.buildVersionLabel(dep, file, context)

      files.push({
        ...file,
        title: meta?.title || file.label || dep.file_name || 'Зависимость',
        iconUrl: meta?.iconUrl || null,
        slug: meta?.slug || null,
        projectType: meta?.projectType || null,
        dependencyType: dep.dependency_type,
        versionLabel,
        isResourcePackFile:
          meta?.projectType === 'resourcepack' ||
          (!dep.project_id && /\.zip$/i.test(dep.file_name || file.filename || '')),
      })
    }

    return files
  }

  resolveDependencyFile(dep, context) {
    const version = dep.version_id
      ? context.pinnedById.get(dep.version_id)
      : dep.project_id
        ? context.resolvedByProject.get(dep.project_id)
        : null

    return VersionPrimaryFile.fromVersion(version, dep.file_name || undefined)
  }

  buildVersionLabel(dep, file, context) {
    if (dep.version_id) {
      const pinned = context.pinnedById.get(dep.version_id)
      if (pinned?.version_number) return pinned.version_number
    }
    if (file.versionNumber) return file.versionNumber
    return 'Любая совместимая'
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
    const results = []
    for (let offset = 0; offset < projectIds.length; offset += this.concurrency) {
      const batch = projectIds.slice(offset, offset + this.concurrency)
      results.push(...(await Promise.all(
        batch.map((projectId) => this.loadLatestProjectVersion(projectId, loader, gameVersion)),
      )))
    }
    return results.filter(Boolean)
  }

  async loadLatestProjectVersion(projectId, loader, gameVersion) {
    const exact = await this.fetchProjectVersions(projectId, loader, gameVersion, 1)
    if (exact.length > 0) return exact[0]

    const compatible = await this.fetchProjectVersions(projectId, loader, null, 100)
    return compatible.find((version) => versionSupportsGameVersion(version, gameVersion)) || null
  }

  async fetchProjectVersions(projectId, loader, gameVersion, limit) {
    const params = new URLSearchParams()
    params.set('loaders', JSON.stringify([loader]))
    if (gameVersion) {
      params.set('game_versions', JSON.stringify([gameVersion]))
    }
    params.set('limit', String(limit))
    const payload = await this.client.getJson(
      `${MODRINTH_API}/project/${encodeURIComponent(projectId)}/version?${params}`,
    )
    return Array.isArray(payload) ? payload : []
  }

  async loadProjectMeta(projectIds) {
    const meta = new Map()
    if (projectIds.length === 0) return meta

    const chunkSize = 100
    for (let offset = 0; offset < projectIds.length; offset += chunkSize) {
      const chunk = projectIds.slice(offset, offset + chunkSize)
      const payload = await this.client.getJson(
        `${MODRINTH_API}/projects?ids=${encodeURIComponent(JSON.stringify(chunk))}`,
      )
      if (!Array.isArray(payload)) continue
      for (const project of payload) {
        const projectType =
          project.project_type ??
          (Array.isArray(project.project_types) ? project.project_types[0] : null)
        meta.set(project.id, {
          title: project.title || project.name,
          iconUrl: project.icon_url || null,
          slug: project.slug || null,
          projectType,
        })
      }
    }

    return meta
  }
}

export function createDownloadDependencyResolver(options = {}) {
  return new DownloadDependencyResolver({ maxUpstreamCalls: 40, ...options })
}
