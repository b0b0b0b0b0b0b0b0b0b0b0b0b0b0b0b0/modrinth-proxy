import { getFilterConfig, getCategoryName } from '@/lib/filterConfig'
import { getServerCategoryName } from '@/lib/serverCategories'
import { SITE_NAME, siteUrl } from '@/lib/site'

const SITE_SUFFIX = 'ModrinthProxy'

function collectServerTagIds(server) {
  return [
    ...new Set([
      ...(server.categories || []),
      ...(server.additional_categories || []),
    ]),
  ].filter(Boolean)
}

export function resolveServerTagLabels(server) {
  const ids = collectServerTagIds(server)
  if (ids.length === 0) return []

  const filterConfig = getFilterConfig('servers')
  return ids.map((id) => {
    const fromFilter = getCategoryName(id, filterConfig)
    if (fromFilter && fromFilter !== id) return fromFilter
    return getServerCategoryName(id) || id
  })
}

function appendTagLabels(description, tagLabels) {
  if (tagLabels.length === 0) return description

  const tagLine = tagLabels.join(', ')
  const trimmed = description?.trim()
  if (!trimmed) return tagLine

  const separator = /[.!?…]$/.test(trimmed) ? ' ' : '. '
  return `${trimmed}${separator}${tagLine}`
}

export function buildServerPageSeo(server) {
  const title = server.title?.trim() || 'Сервер'
  const pageTitle = `Играть на сервере ${title} - Minecraft`
  const tagLabels = resolveServerTagLabels(server)

  const versions =
    server.minecraft_java_server?.content?.supported_game_versions?.join(', ') ||
    'все версии'

  const baseDescription =
    server.description?.trim() ||
    `Сервер майнкрафт ${title}. Поддержка версий: ${versions}.`

  const description = appendTagLabels(baseDescription, tagLabels)

  return {
    title: pageTitle,
    description,
    keywords: tagLabels.length > 0 ? tagLabels : undefined,
    tagLabels,
  }
}

export function buildServerPageMetadata(server, slug) {
  const seo = buildServerPageSeo(server)
  const url = siteUrl(`/server/${slug}`)

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    robots: 'all',
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      url,
      title: seo.title,
      description: seo.description,
      images: server.icon_url ? [{ url: server.icon_url }] : [],
    },
    twitter: {
      card: 'summary',
      title: seo.title,
      description: seo.description,
      images: server.icon_url ? [server.icon_url] : [],
    },
    other: {
      'theme-color': '#1bd96a',
    },
  }
}

export function buildServerNotFoundMetadata() {
  return {
    title: `Сервер не найден | ${SITE_SUFFIX}`,
    description: 'Запрашиваемый сервер не найден',
  }
}
