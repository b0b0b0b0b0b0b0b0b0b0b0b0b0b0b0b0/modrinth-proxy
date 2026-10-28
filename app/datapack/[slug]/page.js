import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { getMod, getModVersions, getTeamMembers, getOrganization, isModrinthNotFound } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import { buildProjectOverviewMetadata, buildProjectGalleryMetadata, buildProjectVersionsMetadata, buildProjectChangelogMetadata, buildProjectNotFoundMetadata, galleryNotFoundMetadata } from '@/lib/projectPageSeo'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import RichMarkdownContent from '@/app/components/RichMarkdownContent'
import { notFoundOrThrow } from '@/lib/projectPageError'

export async function generateMetadata({ params }) {
  try {
    const pack = await getMod(params.slug)
    return buildProjectOverviewMetadata('datapack', params.slug, pack)
  } catch (error) {
    if (!isModrinthNotFound(error)) return {}
    return buildProjectNotFoundMetadata('datapack')
  }
}

export default async function DatapackPage({ params }) {
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/datapacks" backKey="project.backToDatapacks" />
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
      return <ProjectAccessRestricted href="/datapacks" backKey="project.backToDatapacks" />
    }
  } catch (error) {
    notFoundOrThrow(error)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={pack} contentType="datapack" versions={versions} />
      
      <ContentNavigationWithBanner resource={pack} contentType="datapack" versionsCount={versions.length} galleryCount={pack.gallery?.length || 0} projectColor={pack.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="bg-modrinth-dark card-glass rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <RichMarkdownContent className="prose prose-invert prose-sm max-w-none" content={pack.body} />
            </div>
          </div>
        </div>
        
        <ResourceSidebarContainer resource={pack} organization={organization} teamMembers={teamMembers} contentType="datapack" />
      </div>
    </div>
  )
}
