import { fetchSearchResults } from '@/lib/modrinth'
import { filterModsList } from '@/lib/contentFilter'
import { getProjectsByIds } from '@/lib/collections'
import { resolveCanonicalProjectHref } from '@/lib/projectType'
import { SITE_ORIGIN } from '@/lib/site'

export const SITEMAP_DAY_S = 86400
export const SITEMAP_CHUNK = 5000

const PAGE_SIZE = 100
const PARALLEL = 5

export const SECTION_ROUTES = [
  { path: '', changefreq: 'daily', priority: 1.0 },
  { path: '/discover/mods', changefreq: 'daily', priority: 0.8 },
  { path: '/discover/plugins', changefreq: 'daily', priority: 0.8 },
  { path: '/discover/shaders', changefreq: 'daily', priority: 0.8 },
  { path: '/discover/resourcepacks', changefreq: 'daily', priority: 0.8 },
  { path: '/discover/datapacks', changefreq: 'daily', priority: 0.8 },
  { path: '/discover/modpacks', changefreq: 'daily', priority: 0.8 },
  { path: '/discover/servers?sst=online', changefreq: 'daily', priority: 0.8 },
  { path: '/collections', changefreq: 'weekly', priority: 0.6 },
  { path: '/news', changefreq: 'weekly', priority: 0.6 },
  { path: '/extension', changefreq: 'monthly', priority: 0.5 },
  { path: '/bmadnco', changefreq: 'monthly', priority: 0.4 },
  { path: '/protect-bot', changefreq: 'monthly', priority: 0.4 },
]

export const SITEMAP_TYPES = [
  { key: 'mods', facet: 'mod', route: 'mod' },
  { key: 'plugins', facet: 'plugin', route: 'plugin' },
  { key: 'resourcepacks', facet: 'resourcepack', route: 'resourcepack' },
  { key: 'modpacks', facet: 'modpack', route: 'modpack' },
  { key: 'datapacks', facet: 'datapack', route: 'datapack' },
  { key: 'shaders', facet: 'shader', route: 'shader' },
  { key: 'servers', facet: 'minecraft_java_server', route: 'server', checkRealType: true },
]

function search(type, offset, limit) {
  return fetchSearchResults({
    facets: [[`project_type:${type.facet}`]],
    limit,
    offset,
    index: 'downloads',
    nextRevalidate: SITEMAP_DAY_S,
    memoryCache: false,
  })
}

export async function countProjects(type) {
  const result = await search(type, 0, 1)
  return Number(result?.total_hits) || 0
}

export async function sitemapFiles() {
  const counts = await Promise.all(SITEMAP_TYPES.map((type) => countProjects(type).catch(() => 0)))
  const files = ['pages']
  SITEMAP_TYPES.forEach((type, index) => {
    const chunks = Math.ceil(counts[index] / SITEMAP_CHUNK)
    for (let chunk = 1; chunk <= chunks; chunk += 1) files.push(`${type.key}-${chunk}`)
  })
  return files
}

export function parseSitemapFile(name) {
  const match = /^([a-z]+)-(\d{1,4})\.xml$/.exec(name || '')
  if (name === 'pages.xml') return { pages: true }
  if (!match) return null
  const type = SITEMAP_TYPES.find((item) => item.key === match[1])
  const chunk = Number(match[2])
  if (!type || chunk < 1) return null
  return { type, chunk }
}

function priorityFor(rank, total) {
  if (!total) return 0.5
  return Math.round((0.6 - 0.2 * Math.min(1, rank / total)) * 10) / 10
}

export async function projectEntries(type, chunk) {
  const total = await countProjects(type)
  const start = (chunk - 1) * SITEMAP_CHUNK
  if (start >= total) return null
  const end = Math.min(total, start + SITEMAP_CHUNK)
  const offsets = []
  for (let offset = start; offset < end; offset += PAGE_SIZE) offsets.push(offset)

  const pages = []
  for (let i = 0; i < offsets.length; i += PARALLEL) {
    const batch = offsets.slice(i, i + PARALLEL)
    pages.push(...(await Promise.all(batch.map((offset) => search(type, offset, Math.min(PAGE_SIZE, end - offset))))))
  }

  const filtered = []
  for (let p = 0; p < pages.length; p += 1) {
    const { hits } = await filterModsList(pages[p]?.hits || [])
    hits.forEach((project, index) => filtered.push({ project, rank: offsets[p] + index }))
  }

  const pathById = new Map()
  if (type.checkRealType) {
    const projects = await getProjectsByIds(filtered.map(({ project }) => project.id ?? project.project_id))
    projects.forEach((project) => {
      const href = resolveCanonicalProjectHref(project)
      if (href) pathById.set(String(project.id), href)
    })
  }

  const seen = new Set()
  const entries = []
  for (const { project, rank } of filtered) {
    if (!project.slug) continue
    const path =
      pathById.get(String(project.id ?? project.project_id)) || `/${type.route}/${encodeURIComponent(project.slug)}`
    if (seen.has(path)) continue
    seen.add(path)
    const modified = project.date_modified || project.date_created
    entries.push({
      loc: `${SITE_ORIGIN}${path}`,
      lastmod: modified ? new Date(modified).toISOString() : null,
      changefreq: 'weekly',
      priority: priorityFor(rank, total),
    })
  }
  return entries
}

export function sectionEntries() {
  return SECTION_ROUTES.map((route) => ({
    loc: `${SITE_ORIGIN}${route.path}`,
    lastmod: null,
    changefreq: route.changefreq,
    priority: route.priority,
  }))
}

const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[ch])

export function urlsetXml(entries) {
  const body = entries
    .map((entry) => {
      const parts = [`<loc>${escapeXml(entry.loc)}</loc>`]
      if (entry.lastmod) parts.push(`<lastmod>${entry.lastmod}</lastmod>`)
      if (entry.changefreq) parts.push(`<changefreq>${entry.changefreq}</changefreq>`)
      if (entry.priority != null) parts.push(`<priority>${entry.priority.toFixed(1)}</priority>`)
      return `<url>${parts.join('')}</url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function indexXml(files) {
  const now = `${new Date().toISOString().slice(0, 10)}T00:00:00Z`
  const body = files
    .map((file) => `<sitemap><loc>${SITE_ORIGIN}/sitemaps/${file}.xml</loc><lastmod>${now}</lastmod></sitemap>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

export function xmlResponse(xml, status = 200) {
  return new Response(xml, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': status === 200 ? `public, max-age=3600, s-maxage=${SITEMAP_DAY_S}` : 'no-store',
      ...(status === 503 ? { 'Retry-After': '3600' } : {}),
    },
  })
}
