import { notFound } from 'next/navigation'
import { getMod, getModVersions, getUser } from '@/lib/modrinth'
import { filterModContent } from '@/lib/contentFilter'
import VersionPage from '@/app/components/VersionPage'

export async function generateMetadata({ params }) {
  try {
    const mod = filterModContent(await getMod(params.slug))
    const versions = await getModVersions(params.slug)
    const version = versions.find(v => v.version_number === decodeURIComponent(params.versionNumber) || v.id === decodeURIComponent(params.versionNumber))
    
    if (!version) throw new Error('Version not found')
    
    const url = `https://modrinth.black/mod/${params.slug}/version/${params.versionNumber}`
    const versionTitle = version.name || version.version_number
    const description = version.changelog ? version.changelog.slice(0, 150) : `Скачать версию ${versionTitle} мода ${mod.title}`
    
    return {
      title: `${versionTitle} - ${mod.title}`,
      description: description,
      robots: 'all',
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${versionTitle} - ${mod.title}`,
        description: version.changelog ? version.changelog.slice(0, 150) : mod.description,
        images: mod.icon_url ? [{ url: mod.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${versionTitle} - ${mod.title}`,
        description: version.changelog ? version.changelog.slice(0, 150) : mod.description,
        images: mod.icon_url ? [mod.icon_url] : [],
      },
      other: {
        'theme-color': '#1bd96a',
      },
    }
  } catch {
    return {
      title: 'Версия не найдена | ModrinthProxy',
      description: 'Запрашиваемая версия не найдена',
    }
  }
}

export default async function ModVersionPage({ params }) {
  let mod, versions, version, author;
  
  try {
    [mod, versions] = await Promise.all([
      getMod(params.slug),
      getModVersions(params.slug)
    ])
    
    version = versions.find(v => v.version_number === decodeURIComponent(params.versionNumber) || v.id === decodeURIComponent(params.versionNumber))
    
    if (!version) {
      notFound()
    }
    
    if (version.author_id) {
      author = await getUser(version.author_id)
    }
  } catch (error) {
    notFound()
  }

  mod = filterModContent(mod)

  return (
    <VersionPage 
      project={mod}
      version={version}
      author={author}
      contentType="mod"
      pluralName="mods"
      singularName="mod"
      versions={versions}
      galleryCount={mod.gallery?.length || 0}
    />
  )
}
