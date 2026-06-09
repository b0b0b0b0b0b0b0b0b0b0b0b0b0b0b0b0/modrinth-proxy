const SITE_ORIGIN = 'https://modrinth.black'

export function getProfileOgImage(avatarUrl, username) {
  if (!avatarUrl) return null

  let url = avatarUrl

  if (url.includes('avatars.githubusercontent.com')) {
    const parsed = new URL(url)
    parsed.searchParams.set('s', '256')
    url = parsed.toString()
  }

  return {
    url,
    width: 256,
    height: 256,
    alt: username ? `Аватар ${username}` : 'Аватар пользователя',
  }
}

export function buildUserProfileMetadata(author, stats, userId, { profilePath = 'user' } = {}) {
  const title = `${author.username} — автор проектов`
  const description = `Профиль автора ${author.username}. ${stats.projectCount} проектов, ${stats.totalDownloads} загрузок.`
  const ogImage = getProfileOgImage(author.avatar_url, author.username)
  const pageUrl = `${SITE_ORIGIN}/${profilePath}/${userId}`

  return {
    title,
    description,
    robots: 'all',
    openGraph: {
      siteName: 'modrinth.black',
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
