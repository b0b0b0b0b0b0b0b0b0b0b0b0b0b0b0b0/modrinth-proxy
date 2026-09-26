import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { getMod, getModVersions, getTeamMembers, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import IconPreload from '@/app/components/IconPreload'
import ChangelogVersionEntries from '@/app/components/ChangelogVersionEntries'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata({ params }) {
  const { t } = getRequestT()
  try {
    const mod = await getMod(params.slug)
    const url = `https://modrinth.black/mod/${params.slug}/changelog`
    const title = t('project.metaChangelog', { title: mod.title })
    const description = t('project.metaChangelogDesc', { title: mod.title })
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
      title: t('project.notFound'),
      description: t('project.notFoundDesc'),
    }
  }
}

export default async function ModChangelogPage({ params }) {
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/mods" backKey="project.backToMods" />
  }

  let mod, versions, teamMembers, organization;
  try {
    [mod, versions, teamMembers] = await Promise.all([
      getMod(slug),
      getModVersions(slug),
      getTeamMembers(slug),
    ]);
    
    mod = filterModContent(mod);
    organization = mod.organization ? await getOrganization(mod.organization) : null;
    teamMembers = filterTeamMembers(teamMembers);
    
    if ((await isProjectBlocked(mod.slug, mod.id) || isOrganizationBlocked(mod.organization))) {
      return <ProjectAccessRestricted href="/mods" backKey="project.backToMods" />
    }
  } catch (error) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <IconPreload iconUrl={mod.icon_url} />
      <ResourceHeader resource={mod} contentType="mod" versions={versions} />
      
      <ContentNavigationWithBanner resource={mod} contentType="mod" versionsCount={versions.length} galleryCount={mod.gallery?.length || 0} projectColor={mod.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <ChangelogVersionEntries versions={versions} slug={slug} contentType="mod" projectColor={mod.color} />
            </div>
          </div>
        </div>
        
        <ResourceSidebarContainer resource={mod} organization={organization} teamMembers={teamMembers} />
      </div>
    </div>
  )
}
