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
    const modpack = filterModContent(await getMod(params.slug))
    const url = `https://modrinth.black/modpack/${params.slug}/gallery`
    return {
      title: `${modpack.title} - Галерея | ModrinthProxy`,
      description: `Просмотрите галерею изображений для ${modpack.title}`,
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${modpack.title} - Галерея | ModrinthProxy`,
        description: `Просмотрите галерею изображений для ${modpack.title}`,
        images: modpack.icon_url ? [{ url: modpack.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${modpack.title} - Галерея | ModrinthProxy`,
        description: `Просмотрите галерею изображений для ${modpack.title}`,
        images: modpack.icon_url ? [modpack.icon_url] : [],
      },
    }
  } catch {
    return {
      title: 'Галерея не найдена',
    }
  }
}

export default async function ModpackGalleryPage({ params }) {
  const { slug } = params
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/modpacks" backKey="project.backToModpacks" />
  }

  let modpack, versions, organization
  try {
    [modpack, versions] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
    ])
    
    if ((await isProjectBlocked(modpack.slug, modpack.id) || isOrganizationBlocked(modpack.organization))) {
      return <ProjectAccessRestricted href="/modpacks" backKey="project.backToModpacks" />
    }
  } catch (error) {
    notFound()
  }

  modpack = filterModContent(modpack)

  organization = modpack.organization ? await getOrganization(modpack.organization) : null;

  const gallery = modpack.gallery || []
  const filteredGallery = filterGalleryImages(gallery)
  const sortedGallery = [...filteredGallery].sort((a, b) => a.ordering - b.ordering)

  return (
    <div className="max-w-7xl mx-auto">
      <IconPreload iconUrl={modpack.icon_url} />
      <ResourceHeader resource={modpack} contentType="modpack" versions={versions} />
      
      <ContentNavigationWithBanner resource={modpack} contentType="modpack" versionsCount={versions.length} galleryCount={gallery.length} projectColor={modpack.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <GalleryGrid gallery={sortedGallery} />
        </div>
        
        <ResourceSidebarContainer resource={modpack} organization={organization} teamMembers={[]} />
      </div>
    </div>
  )
}
