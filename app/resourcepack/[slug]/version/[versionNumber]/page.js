import { notFound } from 'next/navigation'
import { getMod, getModVersions, getUser } from '@/lib/modrinth'
import { filterModContent } from '@/lib/contentFilter'
import VersionPage from '@/app/components/VersionPage'

export async function generateMetadata({ params }) {
  try {
    const resourcepack = filterModContent(await getMod(params.slug))
    const versions = await getModVersions(params.slug)
    const version = versions.find(v => v.version_number === decodeURIComponent(params.versionNumber) || v.id === decodeURIComponent(params.versionNumber))
    
    if (!version) throw new Error('Version not found')
    
    const url = `https://modrinth.black/resourcepack/${params.slug}/version/${params.versionNumber}`
    const description = version.changelog ? version.changelog.slice(0, 150) : `Скачать версию ${version.version_number} ресурспака ${resourcepack.title}`
    
    return {
      title: `${version.version_number} - ${resourcepack.title}`,
      description: description,
      robots: 'all',
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${version.version_number} - ${resourcepack.title}`,
        description: version.changelog ? version.changelog.slice(0, 150) : resourcepack.description,
        images: resourcepack.icon_url ? [{ url: resourcepack.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${version.version_number} - ${resourcepack.title}`,
        description: version.changelog ? version.changelog.slice(0, 150) : resourcepack.description,
        images: resourcepack.icon_url ? [resourcepack.icon_url] : [],
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

export default async function ResourcepackVersionPage({ params }) {
  let resourcepack, versions, version, author;
  
  try {
    [resourcepack, versions] = await Promise.all([
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

  resourcepack = filterModContent(resourcepack)

  return (
    <VersionPage 
      project={resourcepack}
      version={version}
      author={author}
      contentType="resourcepack"
      pluralName="resourcepacks"
      singularName="resourcepack"
      versions={versions}
      galleryCount={resourcepack.gallery?.length || 0}
    />
  )
}
