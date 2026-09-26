import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { notFound } from 'next/navigation'
import { getMod, getModVersions, getTeamMembers, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import VersionsList from '@/app/components/VersionsList'
import IconPreload from '@/app/components/IconPreload'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata({ params }) {
  const { t } = getRequestT()
  try {
    const mod = await getMod(params.slug)
    const url = `https://modrinth.black/mod/${params.slug}/versions`
    const title = t('project.metaVersions', { title: mod.title })
    const description = t('project.metaVersionsDesc', { title: mod.title })
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

export default async function ModVersionsPage({ params, searchParams }) {
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/mods" backKey="project.backToMods" />
  }

  const initialLoader = searchParams.l || 'all'

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
          <VersionsList versions={versions} contentType="mod" slug={slug} initialLoader={initialLoader} projectColor={mod.color} />
        </div>
        
        <ResourceSidebarContainer resource={mod} organization={organization} teamMembers={teamMembers} contentType="mod" />
      </div>
    </div>
  )
}
