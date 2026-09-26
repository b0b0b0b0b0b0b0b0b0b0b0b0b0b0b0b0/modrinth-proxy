import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { notFound } from 'next/navigation'
import { getMod, getModVersions, getOrganization } from '@/lib/modrinth'
import { isProjectBlocked, isOrganizationBlocked, filterGalleryImages, filterModContent } from '@/lib/contentFilter'
import { buildProjectOverviewMetadata, buildProjectGalleryMetadata, buildProjectVersionsMetadata, buildProjectChangelogMetadata, buildProjectNotFoundMetadata, galleryNotFoundMetadata } from '@/lib/projectPageSeo'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ResourceHeader from '@/app/components/ResourceHeader'
import GalleryGrid from '@/app/components/GalleryGrid'
import IconPreload from '@/app/components/IconPreload'

export async function generateMetadata({ params }) {
  try {
    const shader = filterModContent(await getMod(params.slug))
    return buildProjectGalleryMetadata('shader', params.slug, shader)
  } catch {
    return galleryNotFoundMetadata()
  }
}

export default async function ShaderGalleryPage({ params }) {
  const { slug } = params
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/shaders" backKey="project.backToShaders" />
  }

  let shader, versions, organization
  try {
    [shader, versions] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
    ])
    
    if ((await isProjectBlocked(shader.slug, shader.id) || isOrganizationBlocked(shader.organization))) {
      return <ProjectAccessRestricted href="/shaders" backKey="project.backToShaders" />
    }
  } catch (error) {
    notFound()
  }

  shader = filterModContent(shader)

  organization = shader.organization ? await getOrganization(shader.organization) : null;

  const gallery = shader.gallery || []
  const filteredGallery = filterGalleryImages(gallery)
  const sortedGallery = [...filteredGallery].sort((a, b) => a.ordering - b.ordering)

  return (
    <div className="max-w-7xl mx-auto">
      <IconPreload iconUrl={shader.icon_url} />
      <ResourceHeader resource={shader} contentType="shader" versions={versions} />
      
      <ContentNavigationWithBanner resource={shader} contentType="shader" versionsCount={versions.length} galleryCount={gallery.length} projectColor={shader.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <GalleryGrid gallery={sortedGallery} />
        </div>
        
        <ResourceSidebarContainer resource={shader} organization={organization} teamMembers={[]} />
      </div>
    </div>
  )
}
