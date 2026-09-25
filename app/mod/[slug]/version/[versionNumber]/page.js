import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import VersionPage from '@/app/components/VersionPage'
import { blockedVersionMetadata, loadVersionPage } from '@/lib/loadVersionPage'

export async function generateMetadata({ params }) {
  const data = await loadVersionPage(params.slug, params.versionNumber)
  if (data.denied) return blockedVersionMetadata
  if (data.missing) {
    return {
      title: 'Версия не найдена | ModrinthProxy',
      description: 'Запрашиваемая версия не найдена',
    }
  }

  const { project, version } = data
  const url = `https://modrinth.black/mod/${params.slug}/version/${params.versionNumber}`
  const versionTitle = version.name || version.version_number
  const description = version.changelog ? version.changelog.slice(0, 150) : `Скачать версию ${versionTitle} мода ${project.title}`

  return {
    title: `${versionTitle} - ${project.title}`,
    description,
    robots: 'all',
    openGraph: {
      siteName: 'modrinth.black',
      type: 'website',
      url,
      title: `${versionTitle} - ${project.title}`,
      description: version.changelog ? version.changelog.slice(0, 150) : project.description,
      images: project.icon_url ? [{ url: project.icon_url }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${versionTitle} - ${project.title}`,
      description: version.changelog ? version.changelog.slice(0, 150) : project.description,
      images: project.icon_url ? [project.icon_url] : [],
    },
    other: {
      'theme-color': '#1bd96a',
    },
  }
}

export default async function ModVersionPage({ params }) {
  const data = await loadVersionPage(params.slug, params.versionNumber)
  if (data.denied) {
    return <ProjectAccessRestricted href="/mods" label="Вернуться к модам" />
  }
  if (data.missing) notFound()

  return (
    <VersionPage
      project={data.project}
      version={data.version}
      author={data.author}
      contentType="mod"
      pluralName="mods"
      singularName="mod"
      versions={data.versions}
      galleryCount={data.project.gallery?.length || 0}
    />
  )
}
