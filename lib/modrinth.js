import { cache } from 'react'
import { filterOrganization } from './contentFilter'
import { suggestLayoutCorrection } from './keyboardLayout'

export const MODRINTH_API = 'https://api.modrinth.com/v2'
export const MODRINTH_SERVER_API = 'https://api.modrinth.com/v3'
export const MODRINTH_CDN_HOST = 'cdn.modrinth.com'
export const MODRINTH_CDN = `https://${MODRINTH_CDN_HOST}`
export const MODRINTH_USER_AGENT = 'ModrinthProxyExample/1.0'

export function modrinthRequestHeaders() {
  return { 'User-Agent': MODRINTH_USER_AGENT }
}

function mapFacetStringForSearchApi(facet) {
  if (typeof facet !== 'string') return facet
  if (facet.startsWith('project_type:')) {
    return 'project_types:' + facet.slice('project_type:'.length)
  }
  if (facet.startsWith('versions:')) {
    return 'game_versions:' + facet.slice('versions:'.length)
  }
  return facet
}

function mapFacetsForSearchApi(facets) {
  return facets.map((group) =>
    Array.isArray(group) ? group.map(mapFacetStringForSearchApi) : group,
  )
}

function coerceSideValue(side) {
  if (side == null) return undefined
  if (Array.isArray(side)) return side[0]
  return side
}

const ENV_SIDES = {
  client_only: { client_side: 'required', server_side: 'unsupported' },
  server_only: { client_side: 'unsupported', server_side: 'required' },
  dedicated_server_only: { client_side: 'unsupported', server_side: 'required' },
  client_and_server: { client_side: 'required', server_side: 'required' },
  client_or_server: { client_side: 'optional', server_side: 'optional' },
  client_or_server_prefers_both: {
    client_side: 'optional',
    server_side: 'optional',
  },
}

function environmentToSides(env) {
  const key = String(coerceSideValue(env) ?? '').toLowerCase().replace(/\s+/g, '_')
  return ENV_SIDES[key] ?? {}
}

function normalizeGalleryImages(gallery) {
  if (!Array.isArray(gallery)) return gallery
  return gallery.map((entry) =>
    typeof entry === 'string' ? { url: entry, raw_url: entry } : entry,
  )
}

function deriveLegacyExternalUrls(project) {
  const lu =
    project.link_urls && typeof project.link_urls === 'object'
      ? project.link_urls
      : null
  const pick = (key) => (lu && lu[key]?.url ? lu[key].url : undefined)

  const donationPlatformLabel = (raw) => {
    const p = String(raw ?? '').toLowerCase().replace(/-/g, '_')
    const map = {
      github: 'GitHub Sponsors',
      patreon: 'Patreon',
      paypal: 'PayPal',
      ko_fi: 'Ko-fi',
      kofi: 'Ko-fi',
      opencollective: 'Open Collective',
      buy_me_a_coffee: 'Buy Me a Coffee',
    }
    return map[p] ?? (raw ? String(raw).replace(/_/g, ' ') : 'Other')
  }

  let donationFromLinks = []
  if (lu) {
    donationFromLinks = Object.values(lu).filter(
      (e) =>
        e &&
        typeof e === 'object' &&
        e.donation === true &&
        typeof e.url === 'string',
    )
    donationFromLinks = donationFromLinks.map((e) => ({
      url: e.url,
      platform: donationPlatformLabel(e.platform),
    }))
  }

  const donation_urls =
    Array.isArray(project.donation_urls) && project.donation_urls.length > 0
      ? project.donation_urls
      : donationFromLinks.length > 0
        ? donationFromLinks
        : project.donation_urls

  return {
    issues_url: project.issues_url ?? pick('issues'),
    source_url: project.source_url ?? pick('source'),
    wiki_url: project.wiki_url ?? pick('wiki'),
    discord_url: project.discord_url ?? pick('discord'),
    donation_urls,
  }
}

function normalizeSearchHit(hit) {
  if (!hit || typeof hit !== 'object') return hit
  const sides = environmentToSides(hit.environment)
  const orgForFilter =
    typeof hit.organization_id === 'string'
      ? hit.organization_id
      : hit.organization
  const normalized = {
    ...hit,
    gallery: normalizeGalleryImages(hit.gallery),
    project_id: hit.project_id ?? hit.id,
    title: hit.title ?? hit.name,
    description: hit.summary ?? hit.description ?? '',
    project_type:
      hit.project_type ??
      (Array.isArray(hit.project_types) ? hit.project_types[0] : undefined),
    organization: orgForFilter,
    client_side: coerceSideValue(hit.client_side) ?? sides.client_side,
    server_side: coerceSideValue(hit.server_side) ?? sides.server_side,
    follows: hit.follows ?? hit.followers,
    date_modified: hit.date_modified ?? hit.updated ?? hit.date_created,
  }
  return { ...normalized, ...deriveLegacyExternalUrls(normalized) }
}

function normalizeSearchResponse(payload) {
  if (!payload || !Array.isArray(payload.hits)) return payload
  return {
    ...payload,
    hits: payload.hits.map(normalizeSearchHit),
  }
}

export function normalizeProject(project) {
  if (!project || typeof project !== 'object') return project
  const hasV2Body = project.body != null && project.body !== ''
  const envSides = environmentToSides(project.environment)
  const primaryType =
    project.project_type ??
    (Array.isArray(project.project_types) ? project.project_types[0] : undefined)
  return {
    ...project,
    gallery: normalizeGalleryImages(project.gallery),
    title: project.title ?? project.name,
    body: hasV2Body ? project.body : (project.description ?? ''),
    description: hasV2Body
      ? (project.description ?? '')
      : (project.summary ?? ''),
    project_type: primaryType,
    client_side:
      coerceSideValue(project.client_side) ?? envSides.client_side,
    server_side:
      coerceSideValue(project.server_side) ?? envSides.server_side,
    follows: project.follows ?? project.followers,
    date_modified:
      project.date_modified ?? project.updated ?? project.published,
    ...deriveLegacyExternalUrls(project),
  }
}

function normalizeVersion(version) {
  if (!version || typeof version !== 'object') return version
  return {
    ...version,
    game_versions: Array.isArray(version.game_versions) ? version.game_versions : [],
    loaders: Array.isArray(version.loaders) ? version.loaders : [],
    dependencies: Array.isArray(version.dependencies) ? version.dependencies : [],
    files: Array.isArray(version.files) ? version.files : [],
  }
}

function normalizeVersionsList(versions) {
  return Array.isArray(versions) ? versions.map(normalizeVersion) : versions
}

export function sanitizeBackdropImageUrl(u) {
  if (typeof u !== 'string') return null
  const s = u.trim()
  if (!s || !/^https?:\/\//i.test(s)) return null
  return s
}

export function resolveProjectFeaturedBackdropUrl(project) {
  if (!project || typeof project !== 'object') return null

  let candidate = null
  const fg =
    typeof project.featured_gallery === 'string' &&
    project.featured_gallery.trim()
      ? project.featured_gallery.trim()
      : null
  if (fg) candidate = fg

  const gallery = project.gallery
  const pickUrl = (entry) => {
    if (!entry) return null
    if (typeof entry === 'string') return entry.trim() || null
    const u = entry.url || entry.raw_url
    return typeof u === 'string' && u.trim() ? u.trim() : null
  }

  if (!candidate && Array.isArray(gallery) && gallery.length > 0) {
    const featured = gallery.find(
      (e) => e && (e.featured === true || e.featured === 'true'),
    )
    candidate = pickUrl(featured) || pickUrl(gallery[0])
  }

  if (!candidate && typeof project.icon_url === 'string' && project.icon_url.trim()) {
    candidate = project.icon_url.trim()
  }

  return sanitizeBackdropImageUrl(candidate)
}

function relativeLuminanceSrgb255(r, g, b) {
  const lin = (c) => {
    const v = Math.max(0, Math.min(255, c)) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const R = lin(r)
  const G = lin(g)
  const B = lin(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function wcagContrastRatio(rgbA, rgbB) {
  const La = relativeLuminanceSrgb255(rgbA[0], rgbA[1], rgbA[2])
  const Lb = relativeLuminanceSrgb255(rgbB[0], rgbB[1], rgbB[2])
  const light = Math.max(La, Lb) + 0.05
  const dark = Math.min(La, Lb) + 0.05
  return light / dark
}

export function contrastingTextHexForAccentRgb(bgR, bgG, bgB) {
  const bg = [bgR, bgG, bgB]
  const nearBlack = [16, 16, 18]
  const white = [255, 255, 255]
  const cb = wcagContrastRatio(nearBlack, bg)
  const cw = wcagContrastRatio(white, bg)
  return cb >= cw ? '#101012' : '#ffffff'
}

function parseModrinthPackedRgb(color) {
  let n = color
  if (typeof n === 'string' && /^\d+$/.test(String(n).trim())) {
    n = parseInt(String(n).trim(), 10)
  }
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  const u = Math.trunc(n)
  if (u < 0 || u > 0xffffff) return null
  return {
    u,
    r: (u >> 16) & 0xff,
    g: (u >> 8) & 0xff,
    b: u & 0xff,
  }
}

export function resolveModrinthProjectAccent(color) {
  const rgb = parseModrinthPackedRgb(color)
  if (!rgb) return null
  const { r, g, b, u } = rgb
  const accentHex = `#${u.toString(16).padStart(6, '0')}`
  const activeFgHex = contrastingTextHexForAccentRgb(r, g, b)
  const tr = 0.2
  const baseR = 49
  const baseG = 52
  const baseB = 58
  return {
    accentHex,
    activeFgHex,
    trackBgCss: `rgb(${Math.round(r * tr + baseR * (1 - tr))},${Math.round(g * tr + baseG * (1 - tr))},${Math.round(b * tr + baseB * (1 - tr))})`,
  }
}

export function modrinthHoverAccentHex(color, opts = {}) {
  const lumMin = opts.lumMin ?? 0.11
  const lumMax = opts.lumMax ?? 0.68
  const rgb = parseModrinthPackedRgb(color)
  if (!rgb) return null
  const L = relativeLuminanceSrgb255(rgb.r, rgb.g, rgb.b)
  if (L < lumMin || L > lumMax) return null
  return `#${rgb.u.toString(16).padStart(6, '0')}`
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isServerSearchFacets(facets) {
  return facets.some(group => {
    if (Array.isArray(group)) {
      return group.some(facet => typeof facet === 'string' && facet.includes('project_type:minecraft_java_server'));
    }
    return typeof group === 'string' && group.includes('project_type:minecraft_java_server');
  });
}

async function fetchSearchResults({
  query = '',
  facets = [],
  limit = 20,
  offset = 0,
  index,
  nextRevalidate = 10800,
}) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (query) {
    params.append('query', query);
  }

  const isServerSearch = isServerSearchFacets(facets);

  if (facets.length > 0) {
    const finalFacets = isServerSearch ? mapFacetsForSearchApi(facets) : facets;
    params.append('facets', JSON.stringify(finalFacets));
  }

  if (index && index !== 'relevance') {
    params.append('index', index);
  }

  const baseUrl = isServerSearch ? MODRINTH_SERVER_API : MODRINTH_API;
  const url = `${baseUrl}/search?${params}`
  const maxRetries = 3;
  const retryDelays = [500, 1000, 2000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': MODRINTH_USER_AGENT,
        },
        next: { revalidate: nextRevalidate },
      });

      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status}`);
      }

      return normalizeSearchResponse(await response.json());
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('Modrinth API fetch error after retries:', error);
        throw error;
      }

      console.warn(`Modrinth API fetch attempt ${attempt + 1} failed, retrying...`, error.message);
      await sleep(retryDelays[attempt] || 2000);
    }
  }
}

const resolveSearchQuery = cache(async (rawQuery, facetsKey, index, nextRevalidate) => {
  const trimmed = rawQuery?.trim()
  if (!trimmed) {
    return { effectiveQuery: '', layoutCorrection: null }
  }

  const facets = JSON.parse(facetsKey)
  const probe = async (q) => {
    const data = await fetchSearchResults({
      query: q,
      facets,
      limit: 1,
      offset: 0,
      index,
      nextRevalidate,
    })
    return data?.total_hits ?? 0
  }

  if (await probe(trimmed) > 0) {
    return { effectiveQuery: trimmed, layoutCorrection: null }
  }

  const corrected = suggestLayoutCorrection(trimmed)
  if (!corrected || corrected === trimmed) {
    return { effectiveQuery: trimmed, layoutCorrection: null }
  }

  if (await probe(corrected) > 0) {
    return {
      effectiveQuery: corrected,
      layoutCorrection: { from: trimmed, to: corrected },
    }
  }

  return { effectiveQuery: trimmed, layoutCorrection: null }
})

export async function searchMods({
  query = '',
  facets = [],
  limit = 20,
  offset = 0,
  index,
  nextRevalidate = 10800,
}) {
  let effectiveQuery = query?.trim() || ''
  let layoutCorrection = null

  if (effectiveQuery) {
    const resolved = await resolveSearchQuery(
      query,
      JSON.stringify(facets),
      index,
      nextRevalidate,
    )
    effectiveQuery = resolved.effectiveQuery
    layoutCorrection = resolved.layoutCorrection
  }

  const result = await fetchSearchResults({
    query: effectiveQuery,
    facets,
    limit,
    offset,
    index,
    nextRevalidate,
  })

  return {
    ...result,
    effectiveQuery,
    layoutCorrection: offset === 0 ? layoutCorrection : null,
  }
}

export async function searchServers({
  query = '',
  newFilters = '',
  limit = 20,
  offset = 0,
  index,
  nextRevalidate = 180,
}) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (query) {
    params.append('query', query);
  }

  if (newFilters) {
    params.append('new_filters', newFilters);
  }

  if (index && index !== 'relevance') {
    params.append('index', index);
  }

  const url = `${MODRINTH_SERVER_API}/search?${params}`;
  const maxRetries = 3;
  const retryDelays = [500, 1000, 2000];
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': MODRINTH_USER_AGENT,
        },
        next: { revalidate: nextRevalidate },
      });

      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status}`);
      }

      return normalizeSearchResponse(await response.json());
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('Modrinth API fetch error after retries:', error);
        throw error;
      }
      
      await sleep(retryDelays[attempt] || 2000);
    }
  }
}


async function fetchProject(slugOrId, baseUrl = MODRINTH_API) {
  const url = `${baseUrl}/project/${slugOrId}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Mod not found: ${response.status}`);
    }

    return normalizeProject(await response.json());
  } catch (error) {
    const retryResponse = await fetch(url, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      next: { revalidate: 60 },
    });

    if (!retryResponse.ok) {
      throw new Error(`Mod not found: ${retryResponse.status}`);
    }

    return normalizeProject(await retryResponse.json());
  }
}

export async function getMod(slugOrId) {
  return fetchProject(slugOrId, MODRINTH_API)
}

export async function getServer(slugOrId) {
  return fetchProject(slugOrId, MODRINTH_SERVER_API)
}

export async function getModVersions(slugOrId) {
  const url = `${MODRINTH_API}/project/${slugOrId}/version`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      next: { revalidate: 21600 },
    });

    if (!response.ok) {
      throw new Error(`Versions not found: ${response.status}`);
    }

    return normalizeVersionsList(await response.json());
  } catch (error) {
    const retryResponse = await fetch(url, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      next: { revalidate: 21600 },
    });

    if (!retryResponse.ok) {
      throw new Error(`Versions not found: ${retryResponse.status}`);
    }

    return normalizeVersionsList(await retryResponse.json());
  }
}

export async function getCategories() {
  const response = await fetch(`${MODRINTH_API}/tag/category`, {
    headers: {
      'User-Agent': MODRINTH_USER_AGENT,
    },
    next: { revalidate: 604800 },
  });

  if (!response.ok) {
    throw new Error(`Categories not found: ${response.status}`);
  }

  return response.json();
}

function normalizeGameVersionTagRows(rows) {
  if (!Array.isArray(rows)) return rows
  return rows.map((row) => ({
    version: row.value ?? row.version,
    version_type: row.type ?? row.version_type,
    date: row.created ?? row.date,
    major: Boolean(row.major),
  }))
}

export async function getMinecraftVersions() {
  const url = `${MODRINTH_API}/tag/game_version`
  const response = await fetch(url, {
    headers: {
      'User-Agent': MODRINTH_USER_AGENT,
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`Minecraft versions not found: ${response.status}`);
  }

  const data = await response.json()
  return normalizeGameVersionTagRows(data)
}

export async function getTeamMembers(projectId) {
  const url = `${MODRINTH_API}/project/${projectId}/members`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch (error) {
    return [];
  }
}

export async function getOrganization(organizationId) {
  if (!organizationId) return null

  const url = `${MODRINTH_SERVER_API}/organization/${organizationId}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data?.id) return null
    return filterOrganization(data)
  } catch {
    return null
  }
}

export async function getProjectAuthors(slug, organizationId) {
  const [teamMembers, organization] = await Promise.all([
    getTeamMembers(slug),
    organizationId ? getOrganization(organizationId) : Promise.resolve(null),
  ])

  const resolvedTeamMembers =
    teamMembers.length > 0 ? teamMembers : (organization?.members ?? [])

  return { teamMembers: resolvedTeamMembers, organization }
}

export async function getOrganizationProjects(organizationId) {
  if (!organizationId) return []

  const url = `${MODRINTH_SERVER_API}/organization/${organizationId}/projects`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': MODRINTH_USER_AGENT,
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) return []

    const data = await response.json()
    if (!Array.isArray(data)) return []

    return data.map(normalizeProject)
  } catch {
    return []
  }
}

export function formatDownloads(downloads) {
  if (!downloads && downloads !== 0) return '0';
  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M`;
  }
  if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}K`;
  }
  return downloads.toString();
}

export function formatDownloadsExactRu(downloads) {
  const n = downloads == null || downloads === '' ? NaN : Number(downloads)
  const v = Number.isFinite(n) ? Math.floor(n) : 0
  return new Intl.NumberFormat('ru-RU').format(Math.max(0, v))
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatVersionEnvironment(environment) {
  if (environment == null || environment === '') return '—'
  const key = String(environment).toLowerCase().replace(/\s+/g, '_')
  const labels = {
    unknown: 'Неизвестно',
    dedicated_server_only: 'Только выделенные серверы',
    client_only: 'Клиент',
    server_only: 'Сервер',
    client_and_server: 'Клиент и сервер',
    client_or_server: 'Клиент или сервер',
    client_or_server_prefers_both: 'Клиент и сервер',
  }
  if (labels[key]) return labels[key]
  return key.replace(/_/g, ' ')
}

export async function getVersion(versionId) {
  const response = await fetch(`${MODRINTH_API}/version/${versionId}`, {
    headers: {
      'User-Agent': MODRINTH_USER_AGENT,
    },
    next: { revalidate: 21600 },
  });

  if (!response.ok) {
    throw new Error(`Version not found: ${response.status}`);
  }

  return normalizeVersion(await response.json());
}

export async function getUser(userId) {
  const response = await fetch(`${MODRINTH_API}/user/${userId}`, {
    headers: {
      'User-Agent': MODRINTH_USER_AGENT,
    },
    next: { revalidate: 43200 },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getVersionFromFileHash(hash, algorithm = 'sha512') {
  const normalizedHash = String(hash || '').trim().toLowerCase()
  const normalizedAlgorithm = String(algorithm || 'sha512').trim().toLowerCase()
  if (!/^[a-f0-9]+$/.test(normalizedHash)) {
    throw new Error('Invalid hash format')
  }

  const url = `${MODRINTH_API}/version_file/${normalizedHash}?algorithm=${encodeURIComponent(normalizedAlgorithm)}`
  const response = await fetch(url, {
    headers: modrinthRequestHeaders(),
    next: { revalidate: 300 },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Modrinth API error: ${response.status}`)
  }

  return normalizeVersion(await response.json())
}

export async function getVersionUpdateFromHash(
  hash,
  algorithm,
  { loaders = [], game_versions = [], version_types = null } = {},
) {
  const normalizedHash = String(hash || '').trim().toLowerCase()
  const normalizedAlgorithm = String(algorithm || 'sha512').trim().toLowerCase()
  if (!/^[a-f0-9]+$/.test(normalizedHash)) {
    throw new Error('Invalid hash format')
  }

  const body = {
    loaders: Array.isArray(loaders) ? loaders : [],
    game_versions: Array.isArray(game_versions) ? game_versions : [],
  }
  if (Array.isArray(version_types) && version_types.length > 0) {
    body.version_types = version_types
  }

  const url = `${MODRINTH_API}/version_file/${normalizedHash}/update?algorithm=${encodeURIComponent(normalizedAlgorithm)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...modrinthRequestHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Modrinth API error: ${response.status}`)
  }

  return normalizeVersion(await response.json())
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 Б';
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export function compressVersionRanges(versions) {
  if (!versions || versions.length === 0) return [];
  if (versions.length === 1) return [versions[0]];

  const sortedVersions = [...versions].sort((a, b) => {
    const aParts = a.split('.').map(n => parseInt(n) || 0);
    const bParts = b.split('.').map(n => parseInt(n) || 0);
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const diff = (aParts[i] || 0) - (bParts[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });

  const getMajorMinor = (version) => {
    const parts = version.split('.');
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1]}`;
    }
    return version;
  };

  const isConsecutive = (v1, v2) => {
    const p1 = v1.split('.').map(n => parseInt(n) || 0);
    const p2 = v2.split('.').map(n => parseInt(n) || 0);
    
    if (p1[0] !== p2[0] || p1[1] !== p2[1]) return false;
    
    const patch1 = p1[2] || 0;
    const patch2 = p2[2] || 0;
    
    return patch2 === patch1 + 1;
  };

  const groups = [];
  let currentGroup = [sortedVersions[0]];
  let currentMajorMinor = getMajorMinor(sortedVersions[0]);
  
  for (let i = 1; i < sortedVersions.length; i++) {
    const versionMajorMinor = getMajorMinor(sortedVersions[i]);
    
    if (versionMajorMinor === currentMajorMinor) {
      currentGroup.push(sortedVersions[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sortedVersions[i]];
      currentMajorMinor = versionMajorMinor;
    }
  }
  groups.push(currentGroup);

  return groups.map(group => {
    if (group.length === 1) {
      return group[0];
    }
    
    const majorMinor = getMajorMinor(group[0]);
    const isAllConsecutive = group.every((v, i) => {
      if (i === 0) return true;
      return isConsecutive(group[i - 1], v);
    });
    
    if (isAllConsecutive && group.length > 2) {
      const firstParts = group[0].split('.').map(n => parseInt(n) || 0);
      const lastParts = group[group.length - 1].split('.').map(n => parseInt(n) || 0);
      
      if (firstParts[0] === lastParts[0] && firstParts[1] === lastParts[1]) {
        const firstPatch = firstParts[2] || 0;
        const lastPatch = lastParts[2] || 0;
        const expectedCount = lastPatch - firstPatch + 1;
        
        if (group.length === expectedCount && firstPatch <= 1) {
          return `${majorMinor}.x`;
        }
      }
    }
    
    const first = group[0];
    const last = group[group.length - 1];
    return `${first}–${last}`;
  }).reverse();
}

export function groupVersionsByMajor(versions) {
  if (!versions || versions.length === 0) return [];
  
  const snapshotVersions = [];
  const majorVersionGroups = new Map();
  
  versions.forEach(version => {
    const isSnapshot = /^\d+w\d+[a-z]/.test(version);
    
    if (isSnapshot) {
      snapshotVersions.push(version);
    } else {
      const match = version.match(/^(\d+\.\d+)/);
      if (match) {
        const major = match[1];
        if (!majorVersionGroups.has(major)) {
          majorVersionGroups.set(major, []);
        }
        majorVersionGroups.get(major).push(version);
      } else {
        snapshotVersions.push(version);
      }
    }
  });
  
  const result = [];
  
  const sortedSnapshots = snapshotVersions.sort((a, b) => {
    const aMatch = a.match(/^(\d+)w(\d+)/);
    const bMatch = b.match(/^(\d+)w(\d+)/);
    if (aMatch && bMatch) {
      const aYear = parseInt(aMatch[1]);
      const bYear = parseInt(bMatch[1]);
      if (aYear !== bYear) return bYear - aYear;
      return parseInt(bMatch[2]) - parseInt(aMatch[2]);
    }
    return b.localeCompare(a);
  });
  
  if (sortedSnapshots.length > 0) {
    result.push(sortedSnapshots[0]);
  }
  
  const sortedMajors = Array.from(majorVersionGroups.keys()).sort((a, b) => {
    const aParts = a.split('.').map(n => parseInt(n));
    const bParts = b.split('.').map(n => parseInt(n));
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const diff = (bParts[i] || 0) - (aParts[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
  
  sortedMajors.forEach(major => {
    result.push(`${major}.x`);
  });
  
  return result;
}
