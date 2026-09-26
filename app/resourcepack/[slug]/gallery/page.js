import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { notFound } from 'next/navigation'
import { getMod, getModVersions, getOrganization } from '@/lib/modrinth'
import { isProjectBlocked, isOrganizationBlocked, filterGalleryImages, filterModContent } from '@/lib/contentFilter'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ResourceHeader from '@/app/components/ResourceHeader'
import GalleryGrid from '@/app/components/GalleryGrid'
import IconPreload from '@/app/components/IconPreload'

export async function generateMetadata({ params }) {
  try {
    const pack = filterModContent(await getMod(params.slug))
    const url = `https://modrinth.black/resourcepack/${params.slug}/gallery`
    return {
      title: `${pack.title} - Галерея | ModrinthProxy`,
      description: `Просмотрите галерею изображений для ${pack.title}`,
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${pack.title} - Галерея | ModrinthProxy`,
        description: `Просмотрите галерею изображений для ${pack.title}`,
        images: pack.icon_url ? [{ url: pack.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${pack.title} - Галерея | ModrinthProxy`,
        description: `Просмотрите галерею изображений для ${pack.title}`,
        images: pack.icon_url ? [pack.icon_url] : [],
      },
    }
  } catch {
    return {
      title: 'Галерея не найдена',
    }
  }
}

export default async function ResourcepackGalleryPage({ params }) {
  const { slug } = params
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/resourcepacks" backKey="project.backToResourcepacks" />
  }

  let pack, versions, organization
  try {
    [pack, versions] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
    ])
    
    if ((await isProjectBlocked(pack.slug, pack.id) || isOrganizationBlocked(pack.organization))) {
      return <ProjectAccessRestricted href="/resourcepacks" backKey="project.backToResourcepacks" />
    }
  } catch (error) {
    notFound()
  }

  pack = filterModContent(pack)

  organization = pack.organization ? await getOrganization(pack.organization) : null;

  const gallery = pack.gallery || []
  const filteredGallery = filterGalleryImages(gallery)
  const sortedGallery = [...filteredGallery].sort((a, b) => a.ordering - b.ordering)

  return (
    <div className="max-w-7xl mx-auto">
      <IconPreload iconUrl={pack.icon_url} />
      <ResourceHeader resource={pack} contentType="resourcepack" versions={versions} />
      
      <ContentNavigationWithBanner resource={pack} contentType="resourcepack" versionsCount={versions.length} galleryCount={gallery.length} projectColor={pack.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <GalleryGrid gallery={sortedGallery} />
        </div>
        
        <ResourceSidebarContainer resource={pack} organization={organization} teamMembers={[]} />
      </div>
    </div>
  )
}
