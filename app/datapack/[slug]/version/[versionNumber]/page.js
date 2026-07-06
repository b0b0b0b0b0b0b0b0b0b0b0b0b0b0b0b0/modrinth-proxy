import { notFound } from 'next/navigation'
import { getMod, getModVersions, getUser } from '@/lib/modrinth'
import { filterModContent } from '@/lib/contentFilter'
import VersionPage from '@/app/components/VersionPage'

export async function generateMetadata({ params }) {
  try {
    const datapack = filterModContent(await getMod(params.slug))
    const versions = await getModVersions(params.slug)
    const version = versions.find(v => v.version_number === decodeURIComponent(params.versionNumber) || v.id === decodeURIComponent(params.versionNumber))
    
    if (!version) throw new Error('Version not found')
    
    const url = `https://modrinth.black/datapack/${params.slug}/version/${params.versionNumber}`
    const description = version.changelog ? version.changelog.slice(0, 150) : `Скачать версию ${version.version_number} датапака ${datapack.title}`
    
    return {
      title: `${version.version_number} - ${datapack.title}`,
      description: description,
      robots: 'all',
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${version.version_number} - ${datapack.title}`,
        description: version.changelog ? version.changelog.slice(0, 150) : datapack.description,
        images: datapack.icon_url ? [{ url: datapack.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${version.version_number} - ${datapack.title}`,
        description: version.changelog ? version.changelog.slice(0, 150) : datapack.description,
        images: datapack.icon_url ? [datapack.icon_url] : [],
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

export default async function DatapackVersionPage({ params }) {
  let datapack, versions, version, author;
  
  try {
    [datapack, versions] = await Promise.all([
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

  datapack = filterModContent(datapack)

  return (
    <VersionPage 
      project={datapack}
      version={version}
      author={author}
      contentType="datapack"
      pluralName="datapacks"
      singularName="datapack"
      versions={versions}
      galleryCount={datapack.gallery?.length || 0}
    />
  )
}
