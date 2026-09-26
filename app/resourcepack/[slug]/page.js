import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { getMod, getModVersions, getTeamMembers, formatDownloads, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked, normalizeProjectSlug } from '@/lib/contentFilter'
import { buildProjectOverviewMetadata, buildProjectGalleryMetadata, buildProjectVersionsMetadata, buildProjectChangelogMetadata, buildProjectNotFoundMetadata, galleryNotFoundMetadata } from '@/lib/projectPageSeo'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import MarkdownContent from '@/app/components/MarkdownContent'

export async function generateMetadata({ params }) {
  try {
    const pack = await getMod(params.slug)
    return buildProjectOverviewMetadata('resourcepack', params.slug, pack)
  } catch {
    return buildProjectNotFoundMetadata('resourcepack')
  }
}

export default async function ResourcepackPage({ params }) {
  const slug = normalizeProjectSlug(params.slug);
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/resourcepacks" backKey="project.backToResourcepacks" />
  }

  let pack, versions, teamMembers, organization;
  try {
    [pack, versions, teamMembers] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
      getTeamMembers(slug),
    ]);
    
    pack = filterModContent(pack);
    teamMembers = filterTeamMembers(teamMembers);
    organization = pack.organization ? await getOrganization(pack.organization) : null;
    
    if ((await isProjectBlocked(pack.slug, pack.id) || isOrganizationBlocked(pack.organization))) {
      return <ProjectAccessRestricted href="/resourcepacks" backKey="project.backToResourcepacks" />
    }
  } catch (error) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={pack} contentType="resourcepack" versions={versions} />
      
      <ContentNavigationWithBanner resource={pack} contentType="resourcepack" versionsCount={versions.length} galleryCount={pack.gallery?.length || 0} projectColor={pack.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <MarkdownContent className="prose prose-invert prose-sm max-w-none" content={pack.body} />
            </div>
          </div>
        </div>
        
        <ResourceSidebarContainer resource={pack} organization={organization} teamMembers={teamMembers} />
      </div>
    </div>
  )
}
