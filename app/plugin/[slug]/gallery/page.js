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
    const plugin = filterModContent(await getMod(params.slug))
    const url = `https://modrinth.black/plugin/${params.slug}/gallery`
    return {
      title: `${plugin.title} - Галерея | ModrinthProxy`,
      description: `Просмотрите галерею изображений для ${plugin.title}`,
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${plugin.title} - Галерея | ModrinthProxy`,
        description: `Просмотрите галерею изображений для ${plugin.title}`,
        images: plugin.icon_url ? [{ url: plugin.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${plugin.title} - Галерея | ModrinthProxy`,
        description: `Просмотрите галерею изображений для ${plugin.title}`,
        images: plugin.icon_url ? [plugin.icon_url] : [],
      },
    }
  } catch {
    return {
      title: 'Галерея не найдена',
    }
  }
}

export default async function PluginGalleryPage({ params }) {
  const { slug } = params
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/plugins" backKey="project.backToPlugins" />
  }

  let plugin, versions, organization
  try {
    [plugin, versions] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
    ])
    
    if ((await isProjectBlocked(plugin.slug, plugin.id) || isOrganizationBlocked(plugin.organization))) {
      return <ProjectAccessRestricted href="/plugins" backKey="project.backToPlugins" />
    }
  } catch (error) {
    notFound()
  }

  plugin = filterModContent(plugin)

  organization = plugin.organization ? await getOrganization(plugin.organization) : null;

  const gallery = plugin.gallery || []
  const filteredGallery = filterGalleryImages(gallery)
  const sortedGallery = [...filteredGallery].sort((a, b) => a.ordering - b.ordering)

  return (
    <div className="max-w-7xl mx-auto">
      <IconPreload iconUrl={plugin.icon_url} />
      <ResourceHeader resource={plugin} contentType="plugin" versions={versions} />
      
      <ContentNavigationWithBanner resource={plugin} contentType="plugin" versionsCount={versions.length} galleryCount={gallery.length} projectColor={plugin.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <GalleryGrid gallery={sortedGallery} />
        </div>
        
        <ResourceSidebarContainer resource={plugin} organization={organization} teamMembers={[]} contentType="plugin" />
      </div>
    </div>
  )
}
