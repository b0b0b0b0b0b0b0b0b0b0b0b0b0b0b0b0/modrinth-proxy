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
    const plugin = await getMod(params.slug)
    return buildProjectOverviewMetadata('plugin', params.slug, plugin)
  } catch {
    return buildProjectNotFoundMetadata('plugin')
  }
}

export default async function PluginPage({ params }) {
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/plugins" backKey="project.backToPlugins" />
  }

  let plugin, versions, teamMembers, organization;
  try {
    [plugin, versions, teamMembers] = await Promise.all([
      getMod(slug),
      getModVersions(slug).catch(() => []),
      getTeamMembers(slug),
    ]);
    
    plugin = filterModContent(plugin);
    teamMembers = filterTeamMembers(teamMembers);
    organization = plugin.organization ? await getOrganization(plugin.organization) : null;
    
    if ((await isProjectBlocked(plugin.slug, plugin.id) || isOrganizationBlocked(plugin.organization))) {
      return <ProjectAccessRestricted href="/plugins" backKey="project.backToPlugins" />
    }
  } catch (error) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={plugin} contentType="plugin" versions={versions} />
      
      <ContentNavigationWithBanner resource={plugin} contentType="plugin" versionsCount={versions.length || plugin.versions?.length || 0} galleryCount={plugin.gallery?.length || 0} projectColor={plugin.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <MarkdownContent className="prose prose-invert prose-sm max-w-none" content={plugin.body} />
            </div>
          </div>
        </div>
        
        <ResourceSidebarContainer resource={plugin} organization={organization} teamMembers={teamMembers} contentType="plugin" />
      </div>
    </div>
  )
}
