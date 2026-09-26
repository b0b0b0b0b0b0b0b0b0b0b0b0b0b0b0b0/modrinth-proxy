import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import VersionPage from '@/app/components/VersionPage'
import { generateVersionMetadata, loadVersionPage } from '@/lib/loadVersionPage'

export async function generateMetadata({ params }) {
  return generateVersionMetadata('plugin', params)
}

export default async function PluginVersionPage({ params }) {
  const data = await loadVersionPage(params.slug, params.versionNumber)
  if (data.denied) {
    return <ProjectAccessRestricted href="/plugins" label="Вернуться к плагинам" />
  }
  if (data.missing) notFound()

  return (
    <VersionPage
      project={data.project}
      version={data.version}
      author={data.author}
      contentType="plugin"
      pluralName="plugins"
      singularName="plugin"
      versions={data.versions}
      galleryCount={data.project.gallery?.length || 0}
    />
  )
}
