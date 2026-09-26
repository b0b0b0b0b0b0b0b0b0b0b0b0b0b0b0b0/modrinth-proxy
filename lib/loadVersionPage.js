import { cache } from 'react'
import { getMod, getModVersions, getUser } from '@/lib/modrinth'
import { filterModContent, isProjectAccessDenied } from '@/lib/contentFilter'
import { SITE_NAME, siteUrl } from '@/lib/site'
import { getRequestT } from '@/lib/i18n/server'

export function blockedVersionMetadata() {
  const { t } = getRequestT()
  return {
    title: t('restricted.title'),
    description: t('restricted.p1'),
    robots: 'noindex, nofollow',
  }
}

export const loadVersionPage = cache(async (slug, versionNumber) => {
  if (await isProjectAccessDenied(slug)) {
    return { denied: true }
  }

  try {
    const [project, versions] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
    ])

    if (await isProjectAccessDenied(slug, project)) {
      return { denied: true }
    }

    const decoded = decodeURIComponent(versionNumber)
    const version = versions.find(
      (item) => item.version_number === decoded || item.id === decoded,
    )
    if (!version) return { missing: true }

    let author
    if (version.author_id) {
      author = await getUser(version.author_id)
    }

    return {
      denied: false,
      missing: false,
      project: filterModContent(project),
      versions,
      version,
      author,
    }
  } catch {
    return { missing: true }
  }
})

export async function generateVersionMetadata(type, params) {
  const { t } = getRequestT()
  const data = await loadVersionPage(params.slug, params.versionNumber)
  if (data.denied) return blockedVersionMetadata()
  if (data.missing) {
    return {
      title: t('version.notFound'),
      description: t('version.notFoundDesc'),
    }
  }

  const { project, version } = data
  const versionTitle =
    type === 'mod' ? version.name || version.version_number : version.version_number
  const changelogPreview = version.changelog ? version.changelog.slice(0, 150) : null
  const title = `${versionTitle} - ${project.title}`
  const description =
    changelogPreview ||
    t('version.metaDesc', {
      version: versionTitle,
      type: t(`version.noun.${type}`),
      title: project.title,
    })
  const ogDescription = changelogPreview || project.description
  const url = siteUrl(`/${type}/${params.slug}/version/${params.versionNumber}`)
  const images = project.icon_url ? [{ url: project.icon_url }] : []

  return {
    title,
    description,
    robots: 'all',
    openGraph: {
      siteName: SITE_NAME,
      type: 'website',
      url,
      title,
      description: ogDescription,
      images,
    },
    twitter: {
      card: 'summary',
      title,
      description: ogDescription,
      images: project.icon_url ? [project.icon_url] : [],
    },
    other: {
      'theme-color': '#1bd96a',
    },
  }
}
