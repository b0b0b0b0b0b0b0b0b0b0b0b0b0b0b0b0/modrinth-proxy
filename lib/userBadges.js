import { getSiteTeamBadge } from './siteTeam'

const UserBadgeFlag = {
  MIDAS: 1 << 0,
  EARLY_MODPACK_ADOPTER: 1 << 1,
  EARLY_RESPACK_ADOPTER: 1 << 2,
  EARLY_PLUGIN_ADOPTER: 1 << 3,
  ALPHA_TESTER: 1 << 4,
}

const DOWNLOAD_THRESHOLDS = [
  { id: 'downloads-500m', value: 500_000_000 },
  { id: 'downloads-250m', value: 250_000_000 },
  { id: 'downloads-100m', value: 100_000_000 },
  { id: 'downloads-50m', value: 50_000_000 },
  { id: 'downloads-25m', value: 25_000_000 },
  { id: 'downloads-10m', value: 10_000_000 },
  { id: 'downloads-1m', value: 1_000_000 },
]

const BADGE_META = {
  staff: {},
  moderator: {},
  alpha: {},
  beta: { href: 'https://modrinth.com/news/article/modrinth-beta/' },
  plus: { href: 'https://modrinth.com/plus' },
  'early-modpack': {},
  'early-resourcepack': {},
  'early-plugin': {},
  'early-datapack': {},
  'early-shaders': {},
  'early-servers': {},
  'downloads-1m': {},
  'downloads-10m': {},
  'downloads-25m': {},
  'downloads-50m': {},
  'downloads-100m': {},
  'downloads-250m': {},
  'downloads-500m': {},
}

const PRIDE_26_MIDAS_DURATION_MS = 30 * 24 * 60 * 60 * 1000

function badgeProjectType(projectType) {
  if (projectType === 'minecraft_java_server') return 'server'
  return projectType
}

function hasActivePride26Midas(user, now = Date.now()) {
  const pride26 = user?.campaigns?.pride_26
  if (!pride26?.has_midas || !pride26.last_donated_at) return false
  const lastDonatedAt = Date.parse(pride26.last_donated_at)
  if (!Number.isFinite(lastDonatedAt)) return false
  return lastDonatedAt + PRIDE_26_MIDAS_DURATION_MS > now
}

function hasActiveMidas(user, now = Date.now()) {
  return Boolean((user?.badges || 0) & UserBadgeFlag.MIDAS) || hasActivePride26Midas(user, now)
}

function collectEarliestProjectDates(projects) {
  const earliest = {}
  for (const project of projects || []) {
    const type = badgeProjectType(project.project_type)
    const published = project.published
    if (!type || !published) continue
    const date = new Date(published)
    if (Number.isNaN(date.getTime())) continue
    if (!earliest[type] || date < earliest[type]) {
      earliest[type] = date
    }
  }
  return earliest
}

function checkEarlyAdopter(user, earliest, type, badgeFlag, cutoffIso) {
  const hasFlag = Boolean((user?.badges || 0) & badgeFlag)
  const firstDate = earliest[type]
  const isEarly = firstDate && firstDate < new Date(cutoffIso)
  return hasFlag || isEarly
}

function makeBadge(id) {
  const meta = BADGE_META[id]
  if (!meta) return null
  return {
    id,
    icon: `/images/badges/${id}.svg`,
    nameKey: `userBadges.${id}.name`,
    descriptionKey: `userBadges.${id}.description`,
    href: meta.href ?? null,
  }
}

function makeCustomBadge(badge) {
  if (!badge?.id || !badge?.icon) return null
  return {
    id: badge.id,
    icon: badge.icon,
    name: badge.name ?? null,
    description: badge.description ?? null,
    nameKey: badge.nameKey ?? null,
    descriptionKey: badge.descriptionKey ?? null,
    href: badge.href ?? null,
  }
}

export function resolveUserBadges(user, projects = [], now = Date.now()) {
  if (!user) return []

  const ids = []
  const joinDate = new Date(user.created)
  const earliest = collectEarliestProjectDates(projects)

  let totalDownloads = 0
  for (const project of projects) {
    totalDownloads += project.downloads || 0
  }

  if (user.role === 'admin' || user.role === 'moderator') {
    ids.push('staff')
  }
  if (user.role === 'moderator') {
    ids.push('moderator')
  }

  if (
    Boolean((user.badges || 0) & UserBadgeFlag.ALPHA_TESTER) ||
    joinDate < new Date('2020-11-30T08:00:00.000Z')
  ) {
    ids.push('alpha')
  }

  if (joinDate < new Date('2022-02-27T08:00:00.000Z')) {
    ids.push('beta')
  }

  if (hasActiveMidas(user, now)) {
    ids.push('plus')
  }

  if (checkEarlyAdopter(user, earliest, 'modpack', UserBadgeFlag.EARLY_MODPACK_ADOPTER, '2022-05-23T00:57:00.000Z')) {
    ids.push('early-modpack')
  }
  if (checkEarlyAdopter(user, earliest, 'resourcepack', UserBadgeFlag.EARLY_RESPACK_ADOPTER, '2022-08-27T23:03:00.000Z')) {
    ids.push('early-resourcepack')
  }
  if (checkEarlyAdopter(user, earliest, 'plugin', UserBadgeFlag.EARLY_PLUGIN_ADOPTER, '2022-08-27T23:03:00.000Z')) {
    ids.push('early-plugin')
  }

  const firstDatapack = earliest.datapack
  if (firstDatapack && firstDatapack < new Date('2023-01-08T02:00:00.000Z')) {
    ids.push('early-datapack')
  }

  const firstShader = earliest.shader
  if (firstShader && firstShader < new Date('2023-01-08T02:00:00.000Z')) {
    ids.push('early-shaders')
  }

  const firstServer = earliest.server
  if (firstServer && firstServer < new Date('2026-03-04T01:33:00.000Z')) {
    ids.push('early-servers')
  }

  const downloadBadge = DOWNLOAD_THRESHOLDS.find((entry) => totalDownloads >= entry.value)
  if (downloadBadge) {
    ids.push(downloadBadge.id)
  }

  const modrinthBadges = ids.map(makeBadge).filter(Boolean)
  const siteBadge = makeCustomBadge(getSiteTeamBadge(user))

  return siteBadge ? [siteBadge, ...modrinthBadges] : modrinthBadges
}
