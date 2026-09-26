import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { notFound } from 'next/navigation'
import { getMod, getModVersions, getTeamMembers, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import IconPreload from '@/app/components/IconPreload'
import ChangelogVersionEntries from '@/app/components/ChangelogVersionEntries'

export async function generateMetadata({ params }) {
  try {
    const plugin = await getMod(params.slug)
    const url = `https://modrinth.black/plugin/${params.slug}/changelog`
    return {
      title: `${plugin.title} - Изменения | ModrinthProxy`,
      description: `История изменений плагина ${plugin.title}`,
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${plugin.title} - Изменения | ModrinthProxy`,
        description: `История изменений плагина ${plugin.title}`,
        images: plugin.icon_url ? [{ url: plugin.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${plugin.title} - Изменения | ModrinthProxy`,
        description: `История изменений плагина ${plugin.title}`,
        images: plugin.icon_url ? [plugin.icon_url] : [],
      },
    }
  } catch {
    return {
      title: 'Плагин не найден | ModrinthProxy',
      description: 'Запрашиваемый плагин не найден',
    }
  }
}

export default async function PluginChangelogPage({ params }) {
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/plugins" backKey="project.backToPlugins" />
  }

  let plugin, versions, teamMembers, organization;
  try {
    [plugin, versions, teamMembers] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
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
      <IconPreload iconUrl={plugin.icon_url} />
      <ResourceHeader resource={plugin} contentType="plugin" versions={versions} />
      
      <ContentNavigationWithBanner resource={plugin} contentType="plugin" versionsCount={versions.length} galleryCount={plugin.gallery?.length || 0} projectColor={plugin.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <ChangelogVersionEntries versions={versions} slug={slug} contentType="plugin" projectColor={plugin.color} />
            </div>
          </div>
        </div>
        
        <ResourceSidebarContainer resource={plugin} organization={organization} teamMembers={teamMembers} contentType="plugin" />
      </div>
    </div>
  )
}
