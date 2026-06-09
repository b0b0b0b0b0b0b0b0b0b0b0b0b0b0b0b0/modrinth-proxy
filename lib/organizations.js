import { getOrganization } from './modrinth'
import { isOrganizationBlocked } from './contentFilter'

export function collectOrganizationIds(projects) {
  const ids = new Set()
  for (const project of projects || []) {
    const orgId = project?.organization
    if (orgId && !isOrganizationBlocked(orgId)) {
      ids.add(orgId)
    }
  }
  return [...ids]
}

export async function resolveOrganizationsFromProjects(projects) {
  const ids = collectOrganizationIds(projects)
  if (ids.length === 0) return []

  const organizations = await Promise.all(ids.map((id) => getOrganization(id)))
  return organizations.filter((org) => org?.id && !isOrganizationBlocked(org.id))
}

export class OrganizationPresenter {
  constructor(data) {
    this.data = data && typeof data === 'object' ? data : null
  }

  static isPresent(data) {
    return Boolean(data?.id && (data?.name || data?.slug))
  }

  get id() {
    return this.data?.id ?? null
  }

  get slug() {
    return this.data?.slug ?? null
  }

  get name() {
    return this.data?.name ?? this.slug ?? this.id
  }

  get description() {
    return this.data?.description ?? ''
  }

  get iconUrl() {
    return this.data?.icon_url ?? null
  }

  get href() {
    return `/organization/${this.id}`
  }

  get members() {
    return Array.isArray(this.data?.members) ? this.data.members : []
  }
}

export class OrganizationStats {
  constructor(organization, projects = []) {
    this.organization = organization
    this.projects = Array.isArray(projects) ? projects : []
  }

  get memberCount() {
    return Array.isArray(this.organization?.members) ? this.organization.members.length : 0
  }

  get projectCount() {
    return this.projects.length
  }

  get totalDownloads() {
    return this.projects.reduce((sum, project) => sum + (project.downloads || 0), 0)
  }
}

export function formatOrganizationDownloadsRu(downloads) {
  const value = Number(downloads) || 0
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(millions)} млн`
  }
  if (value >= 1_000) {
    const thousands = value / 1_000
    return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(thousands)} тыс.`
  }
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function pluralRu(count, one, few, many) {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return many
  if (n1 > 1 && n1 < 5) return few
  if (n1 === 1) return one
  return many
}
