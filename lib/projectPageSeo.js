import { formatDownloads } from '@/lib/modrinth'
import { getRequestT } from '@/lib/i18n/server'

const PATH = {
  mod: 'mod',
  plugin: 'plugin',
  shader: 'shader',
  datapack: 'datapack',
  resourcepack: 'resourcepack',
  modpack: 'modpack',
}

const META_TITLE = {
  mod: 'project.metaMod',
  plugin: 'project.metaPlugin',
  shader: 'project.metaShader',
  datapack: 'project.metaDatapack',
  resourcepack: 'project.metaResourcepack',
  modpack: 'project.metaModpack',
}

const NOT_FOUND = {
  mod: ['project.notFound', 'project.notFoundDesc'],
  plugin: ['project.notFoundPlugin', 'project.notFoundDescPlugin'],
  shader: ['project.notFoundShader', 'project.notFoundDescShader'],
  datapack: ['project.notFoundDatapack', 'project.notFoundDescDatapack'],
  resourcepack: ['project.notFoundResourcepack', 'project.notFoundDescResourcepack'],
  modpack: ['project.notFoundModpack', 'project.notFoundDescModpack'],
}

function pageUrl(kind, slug, extraPath) {
  return `https://modrinth.black/${PATH[kind]}/${slug}${extraPath}`
}

function wrap({ title, description, url, image, ogDescription, includeTheme }) {
  const ogDesc = ogDescription ?? description
  return {
    title,
    description,
    robots: 'all',
    openGraph: {
      siteName: 'modrinth.black',
      type: 'website',
      url,
      title,
      description: ogDesc,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description: ogDesc,
      images: image ? [image] : [],
    },
    ...(includeTheme ? { other: { 'theme-color': '#1bd96a' } } : {}),
  }
}

export function buildProjectNotFoundMetadata(kind) {
  const { t } = getRequestT()
  const [titleKey, descKey] = NOT_FOUND[kind] || NOT_FOUND.mod
  return {
    title: t(titleKey),
    description: t(descKey),
  }
}

export function buildProjectOverviewMetadata(kind, slug, resource) {
  const { t } = getRequestT()
  const title = t(META_TITLE[kind], { title: resource.title })
  const description =
    resource.description ||
    t('project.seoDesc', {
      title: resource.title,
      downloads: formatDownloads(resource.downloads),
      versions: resource.game_versions?.slice(0, 3).join(', ') || '',
    })
  return wrap({
    title,
    description,
    url: pageUrl(kind, slug, ''),
    image: resource.icon_url,
    ogDescription: resource.description || description,
    includeTheme: true,
  })
}

export function buildProjectGalleryMetadata(kind, slug, resource) {
  const { t } = getRequestT()
  const title = t('project.metaGallery', { title: resource.title })
  const description = t('project.metaGalleryDesc', { title: resource.title })
  return wrap({
    title,
    description,
    url: pageUrl(kind, slug, '/gallery'),
    image: resource.icon_url,
  })
}

export function buildProjectVersionsMetadata(kind, slug, resource) {
  const { t } = getRequestT()
  const title = t('project.metaVersions', { title: resource.title })
  const description =
    kind === 'mod'
      ? t('project.metaVersionsDesc', { title: resource.title })
      : t('project.metaVersionsDescKind', { kind: t(`version.noun.${kind}`), title: resource.title })
  return wrap({
    title,
    description,
    url: pageUrl(kind, slug, '/versions'),
    image: resource.icon_url,
  })
}

export function buildProjectChangelogMetadata(kind, slug, resource) {
  const { t } = getRequestT()
  const title = t('project.metaChangelog', { title: resource.title })
  const description =
    kind === 'mod'
      ? t('project.metaChangelogDesc', { title: resource.title })
      : t('project.metaChangelogDescKind', { kind: t(`version.noun.${kind}`), title: resource.title })
  return wrap({
    title,
    description,
    url: pageUrl(kind, slug, '/changelog'),
    image: resource.icon_url,
  })
}

export function galleryNotFoundMetadata() {
  const { t } = getRequestT()
  return { title: t('project.galleryNotFound') }
}
