import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { notFound } from 'next/navigation'
import { getMod, getModVersions, getOrganization } from '@/lib/modrinth'
import { isProjectBlocked, isOrganizationBlocked, filterGalleryImages, filterModContent } from '@/lib/contentFilter'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ResourceHeader from '@/app/components/ResourceHeader'
import GalleryGrid from '@/app/components/GalleryGrid'
import IconPreload from '@/app/components/IconPreload'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata({ params }) {
  const { t } = getRequestT()
  try {
    const mod = filterModContent(await getMod(params.slug))
    const url = `https://modrinth.black/mod/${params.slug}/gallery`
    const title = t('project.metaGallery', { title: mod.title })
    const description = t('project.metaGalleryDesc', { title: mod.title })
    return {
      title,
      description,
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title,
        description,
        images: mod.icon_url ? [{ url: mod.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: mod.icon_url ? [mod.icon_url] : [],
      },
    }
  } catch {
    return {
      title: t('project.galleryNotFound'),
    }
  }
}

export default async function ModGalleryPage({ params }) {
  const { slug } = params
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/mods" backKey="project.backToMods" />
  }

  let mod, versions, organization
  try {
    [mod, versions] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
    ])
    
    if ((await isProjectBlocked(mod.slug, mod.id) || isOrganizationBlocked(mod.organization))) {
      return <ProjectAccessRestricted href="/mods" backKey="project.backToMods" />
    }
  } catch (error) {
    notFound()
  }

  mod = filterModContent(mod)

  organization = mod.organization ? await getOrganization(mod.organization) : null;

  const gallery = mod.gallery || []
  const filteredGallery = filterGalleryImages(gallery)
  const sortedGallery = [...filteredGallery].sort((a, b) => a.ordering - b.ordering)

  return (
    <div className="max-w-7xl mx-auto">
      <IconPreload iconUrl={mod.icon_url} />
      <ResourceHeader resource={mod} contentType="mod" versions={versions} />
      
      <ContentNavigationWithBanner resource={mod} contentType="mod" versionsCount={versions.length} galleryCount={gallery.length} projectColor={mod.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <GalleryGrid gallery={sortedGallery} />
        </div>
        
        <ResourceSidebarContainer resource={mod} organization={organization} teamMembers={[]} />
      </div>
    </div>
  )
}
