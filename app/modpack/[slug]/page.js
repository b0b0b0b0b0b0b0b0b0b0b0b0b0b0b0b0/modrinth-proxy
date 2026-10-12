import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { getMod, getModVersions, getTeamMembers, formatDownloads, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import { buildProjectOverviewMetadata, buildProjectGalleryMetadata, buildProjectVersionsMetadata, buildProjectChangelogMetadata, buildProjectNotFoundMetadata, galleryNotFoundMetadata } from '@/lib/projectPageSeo'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import MarkdownContent from '@/app/components/MarkdownContent'

export async function generateMetadata({ params }) {
  try {
    const modpack = await getMod(params.slug)
    return buildProjectOverviewMetadata('modpack', params.slug, modpack)
  } catch {
    return buildProjectNotFoundMetadata('modpack')
  }
}

export default async function ModpackPage({ params }) {
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/modpacks" backKey="project.backToModpacks" />;
  }

  let modpack, versions, teamMembers, organization;
  
  try {
    [modpack, versions, teamMembers] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
      getTeamMembers(slug),
    ]);

    modpack = filterModContent(modpack);
    teamMembers = filterTeamMembers(teamMembers);
    organization = modpack.organization ? await getOrganization(modpack.organization) : null;

    if ((await isProjectBlocked(modpack.slug, modpack.id) || isOrganizationBlocked(modpack.organization))) {
      return <ProjectAccessRestricted href="/modpacks" backKey="project.backToModpacks" />;
    }
  } catch (error) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={modpack} contentType="modpack" versions={versions} />
      
      <ContentNavigationWithBanner resource={modpack} contentType="modpack" versionsCount={versions.length} galleryCount={modpack.gallery?.length || 0} projectColor={modpack.color} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <MarkdownContent className="prose prose-invert prose-sm max-w-none" content={modpack.body} />
            </div>
          </div>
        </div>

        <ResourceSidebarContainer resource={modpack} organization={organization} teamMembers={teamMembers} />
      </div>
    </div>
  )
}
