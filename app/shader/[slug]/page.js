import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { getMod, getModVersions, getTeamMembers, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import { buildProjectOverviewMetadata, buildProjectGalleryMetadata, buildProjectVersionsMetadata, buildProjectChangelogMetadata, buildProjectNotFoundMetadata, galleryNotFoundMetadata } from '@/lib/projectPageSeo'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import MarkdownContent from '@/app/components/MarkdownContent'

export async function generateMetadata({ params }) {
  try {
    const shader = await getMod(params.slug)
    return buildProjectOverviewMetadata('shader', params.slug, shader)
  } catch {
    return buildProjectNotFoundMetadata('shader')
  }
}

export default async function ShaderPage({ params }) {
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/shaders" backKey="project.backToShaders" />
  }

  let shader, versions, teamMembers, organization;
  try {
    [shader, versions, teamMembers] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
      getTeamMembers(slug),
    ]);
    
    shader = filterModContent(shader);
    teamMembers = filterTeamMembers(teamMembers);
    organization = shader.organization ? await getOrganization(shader.organization) : null;
    
    if ((await isProjectBlocked(shader.slug, shader.id) || isOrganizationBlocked(shader.organization))) {
      return <ProjectAccessRestricted href="/shaders" backKey="project.backToShaders" />
    }
  } catch (error) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={shader} contentType="shader" versions={versions} />
      
      <ContentNavigationWithBanner resource={shader} contentType="shader" versionsCount={versions.length} galleryCount={shader.gallery?.length || 0} projectColor={shader.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <MarkdownContent className="prose prose-invert prose-sm max-w-none" content={shader.body} />
            </div>
          </div>
        </div>
        
        <ResourceSidebarContainer resource={shader} organization={organization} teamMembers={teamMembers} />
      </div>
    </div>
  )
}
