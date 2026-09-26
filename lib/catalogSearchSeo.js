import { searchMods } from './modrinth'
import { parseVersionParams, appendVersionParams, versionFacets } from './catalogVersionParams'
import { appendDisclosureExclusionFacets } from './disclosureExclusions'
import { SITE_NAME, SITE_ORIGIN } from './site'
import { getRequestT } from './i18n/server'
import { pluralize } from './i18n/pluralize'

const SITE_SUFFIX = 'ModrinthProxy'

export const CATALOG_SEO = {
  mods: { facet: [['project_type:mod']] },
  plugins: { facet: [['project_type:plugin']] },
  shaders: { facet: [['project_type:shader']] },
  resourcepacks: { facet: [['project_type:resourcepack']] },
  datapacks: { facet: [['project_type:datapack']] },
  modpacks: { facet: [['project_type:modpack']] },
}

const SEARCH_ALT = {
  mods: 'mods',
  plugins: 'plugins',
  shaders: 'shaders',
  resourcepacks: 'resourcepacks',
  datapacks: 'datapacks',
  modpacks: 'modpacks',
}

function formatCountLabel(t, locale, catalogKey, count) {
  const stem = SEARCH_ALT[catalogKey]
  const one = t(`catalog.searchAlt.${stem}One`, { n: count })
  const few = t(`catalog.searchAlt.${stem}Few`, { n: count })
  const many = t(`catalog.searchAlt.${stem}Many`, { n: count })
  return pluralize(count, locale, one, few, many)
}

function pickQuery(searchParams) {
  return typeof searchParams?.q === 'string' ? searchParams.q.trim() : ''
}

function pickVersionLabel(searchParams) {
  const versions = parseVersionParams(searchParams)
  if (versions.length === 0) return ''
  if (versions.length === 1) return versions[0]
  return versions.join(', ')
}

function pickPage(searchParams) {
  return Math.max(1, parseInt(String(searchParams?.page || '1'), 10) || 1)
}

function seoCopy(t, catalogKey) {
  return {
    label: t(`seo.${catalogKey}.label`),
    titleDefault: t(`seo.${catalogKey}.titleDefault`),
    descDefault: t(`seo.${catalogKey}.descDefault`),
    tech: t(`seo.${catalogKey}.tech`),
  }
}

function buildPageSuffix(t, page) {
  return page > 1 ? t('seo.pageSuffix', { page }) : ''
}

function buildSearchPhraseTitle(t, copy, query, version) {
  const phrase = query?.trim()
  if (!phrase) return copy.titleDefault
  if (version) {
    return t('seo.searchTitleVer', { label: copy.label, query: phrase, version })
  }
  return t('seo.searchTitle', { label: copy.label, query: phrase })
}

function buildCatalogTitle(t, copy, { query, version, page }) {
  const suffix = buildPageSuffix(t, page)
  if (query) {
    return t('seo.titlePipe', { title: `${buildSearchPhraseTitle(t, copy, query, version)}${suffix}`, site: SITE_SUFFIX })
  }

  if (version) {
    return t('seo.titlePipe', { title: `${t('seo.forVersion', { label: copy.label, version })}${suffix}`, site: SITE_SUFFIX })
  }

  return t('seo.titlePipe', { title: `${copy.titleDefault}${suffix}`, site: SITE_SUFFIX })
}

function buildCatalogDescription(t, locale, catalogKey, copy, { query, version, totalHits }) {
  if (query) {
    let text = ''
    if (typeof totalHits === 'number' && totalHits > 0) {
      text = t('seo.hits', { count: formatCountLabel(t, locale, catalogKey, totalHits), query })
    } else {
      text = t('seo.byQuery', { kind: copy.label.toLowerCase(), query })
    }
    text += t('seo.freeTech', { tech: copy.tech })
    if (version) {
      text += t('seo.verLine', { version })
    }
    return text
  }

  if (version) {
    return t('seo.forVersionDesc', { label: copy.label, version, desc: copy.descDefault })
  }

  return copy.descDefault
}

function appendSearchParams(params, searchParams) {
  const query = pickQuery(searchParams)
  const versions = parseVersionParams(searchParams)
  const page = pickPage(searchParams)

  if (query) params.set('q', query)
  appendVersionParams(params, versions)
  if (page > 1) params.set('page', String(page))

  const sort = searchParams?.sort
  if (sort && sort !== 'relevance') params.set('sort', sort)

  return params
}

export function buildCatalogCanonicalUrl(basePath, searchParams) {
  const params = appendSearchParams(new URLSearchParams(), searchParams)
  const qs = params.toString()
  const path = basePath.startsWith('/') ? basePath : `/${basePath}`
  return `${SITE_ORIGIN}${path}${qs ? `?${qs}` : ''}`
}

async function fetchSearchTotalHits(config, query, versions, searchParams, catalogKey) {
  const facets = [...config.facet]
  const versionsFacet = versionFacets(versions)
  if (versionsFacet) facets.push(versionsFacet)
  appendDisclosureExclusionFacets(facets, searchParams, catalogKey)

  const data = await searchMods({
    query,
    facets,
    limit: 1,
    offset: 0,
    nextRevalidate: 3600,
  })

  return typeof data?.total_hits === 'number' ? data.total_hits : null
}

export async function buildCatalogSearchMetadata(catalogKey, searchParams = {}, { basePath } = {}) {
  const config = CATALOG_SEO[catalogKey]
  if (!config) {
    throw new Error(`Unknown catalog SEO key: ${catalogKey}`)
  }

  const { t, locale } = getRequestT()
  const copy = seoCopy(t, catalogKey)
  const query = pickQuery(searchParams)
  const versions = parseVersionParams(searchParams)
  const version = pickVersionLabel(searchParams)
  const page = pickPage(searchParams)
  const title = buildCatalogTitle(t, copy, { query, version, page })
  let description = buildCatalogDescription(t, locale, catalogKey, copy, { query, version, totalHits: null })

  if (query) {
    try {
      const totalHits = await fetchSearchTotalHits(config, query, versions, searchParams, catalogKey)
      description = buildCatalogDescription(t, locale, catalogKey, copy, { query, version, totalHits })
    } catch {
    }
  }

  const canonical = basePath ? buildCatalogCanonicalUrl(basePath, searchParams) : undefined

  return {
    title,
    description,
    robots: 'all',
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      title,
      description,
      ...(canonical ? { url: canonical } : {}),
    },
    ...(canonical ? { alternates: { canonical } } : {}),
  }
}
