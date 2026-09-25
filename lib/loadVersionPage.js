import { cache } from 'react'
import { getMod, getModVersions, getUser } from '@/lib/modrinth'
import { filterModContent, isProjectAccessDenied } from '@/lib/contentFilter'

export const blockedVersionMetadata = {
  title: 'Доступ ограничен',
  description: 'Данный проект недоступен',
  robots: 'noindex, nofollow',
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
