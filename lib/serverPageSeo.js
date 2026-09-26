import { getServerCategoryName } from '@/lib/serverCategories'
import { categoryLabel } from '@/lib/i18n/label'
import { getRequestT } from '@/lib/i18n/server'
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

export function resolveServerTagLabels(server, t) {
  const ids = collectServerTagIds(server)
  if (ids.length === 0) return []

  return ids.map((id) => categoryLabel(t, id, getServerCategoryName(id) || id))
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
  const { t } = getRequestT()
  const title = server.title?.trim() || t('server.metaFallbackName')
  const pageTitle = t('server.metaTitle', { title })
  const tagLabels = resolveServerTagLabels(server, t)

  const versions =
    server.minecraft_java_server?.content?.supported_game_versions?.join(', ') ||
    t('server.metaAllVersions')

  const baseDescription =
    server.description?.trim() ||
    t('server.metaDesc', { title, versions })

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
