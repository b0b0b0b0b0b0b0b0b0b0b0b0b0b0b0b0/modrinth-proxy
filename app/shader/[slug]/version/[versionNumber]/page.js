import { notFound } from 'next/navigation'
import { getMod, getModVersions, getUser } from '@/lib/modrinth'
import { filterModContent } from '@/lib/contentFilter'
import VersionPage from '@/app/components/VersionPage'

export async function generateMetadata({ params }) {
  try {
    const shader = filterModContent(await getMod(params.slug))
    const versions = await getModVersions(params.slug)
    const version = versions.find(v => v.version_number === decodeURIComponent(params.versionNumber) || v.id === decodeURIComponent(params.versionNumber))
    
    if (!version) throw new Error('Version not found')
    
    const url = `https://modrinth.black/shader/${params.slug}/version/${params.versionNumber}`
    const description = version.changelog ? version.changelog.slice(0, 150) : `Скачать версию ${version.version_number} шейдера ${shader.title}`
    
    return {
      title: `${version.version_number} - ${shader.title}`,
      description: description,
      robots: 'all',
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${version.version_number} - ${shader.title}`,
        description: version.changelog ? version.changelog.slice(0, 150) : shader.description,
        images: shader.icon_url ? [{ url: shader.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${version.version_number} - ${shader.title}`,
        description: version.changelog ? version.changelog.slice(0, 150) : shader.description,
        images: shader.icon_url ? [shader.icon_url] : [],
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

export default async function ShaderVersionPage({ params }) {
  let shader, versions, version, author;
  
  try {
    [shader, versions] = await Promise.all([
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

  shader = filterModContent(shader)

  return (
    <VersionPage 
      project={shader}
      version={version}
      author={author}
      contentType="shader"
      pluralName="shaders"
      singularName="shader"
      versions={versions}
      galleryCount={shader.gallery?.length || 0}
    />
  )
}
