import { SITE_NAME, SITE_ORIGIN } from './site'
import { getRequestT } from './i18n/server'

export async function getProfileOgImage(avatarUrl, username) {
  if (!avatarUrl) return null

  let url = avatarUrl.startsWith('/') ? `${SITE_ORIGIN}${avatarUrl}` : avatarUrl

  if (url.includes('avatars.githubusercontent.com')) {
    const parsed = new URL(url)
    parsed.searchParams.set('s', '256')
    url = parsed.toString()
  }

  const { t } = await getRequestT()
  return {
    url,
    width: 256,
    height: 256,
    alt: username ? t('author.avatarAlt', { name: username }) : t('author.avatarFallback'),
  }
}

export async function buildUserProfileMetadata(author, stats, userId, { profilePath = 'user' } = {}) {
  const { t } = await getRequestT()
  const title = t('author.metaTitle', { name: author.username })
  const description = t('author.metaDesc', {
    name: author.username,
    projects: stats.projectCount,
    downloads: stats.totalDownloads,
  })
  const ogImage = await getProfileOgImage(author.avatar_url, author.username)
  const pageUrl = `${SITE_ORIGIN}/${profilePath}/${userId}`

  return {
    title,
    description,
    robots: 'all',
    openGraph: {
      siteName: SITE_NAME,
      type: 'profile',
      url: pageUrl,
      title,
      description: author.bio || description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description: author.bio || description,
      ...(ogImage ? { images: [ogImage.url] } : {}),
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}
