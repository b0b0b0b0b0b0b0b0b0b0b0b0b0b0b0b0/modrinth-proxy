import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { getMod, getModVersions, getTeamMembers, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import VersionsList from '@/app/components/VersionsList'
import IconPreload from '@/app/components/IconPreload'

export async function generateMetadata({ params }) {
  try {
    const modpack = await getMod(params.slug)
    const url = `https://modrinth.black/modpack/${params.slug}/versions`
    return {
      title: `${modpack.title} - Версии | ModrinthProxy`,
      description: `Все версии модпака ${modpack.title}.`,
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${modpack.title} - Версии | ModrinthProxy`,
        description: `Все версии модпака ${modpack.title}.`,
        images: modpack.icon_url ? [{ url: modpack.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${modpack.title} - Версии | ModrinthProxy`,
        description: `Все версии модпака ${modpack.title}.`,
        images: modpack.icon_url ? [modpack.icon_url] : [],
      },
    }
  } catch {
    return { title: 'Модпак не найден | ModrinthProxy' }
  }
}

export default async function ModpackVersionsPage({ params, searchParams }) {
  const { slug } = params;
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/modpacks" backKey="project.backToModpacks" />
  }

  const initialLoader = searchParams.l || 'all'

  let modpack, versions, teamMembers, organization;
  try {
    [modpack, versions, teamMembers] = await Promise.all([getMod(slug), getModVersions(slug), getTeamMembers(slug)]);
    modpack = filterModContent(modpack);
    teamMembers = filterTeamMembers(teamMembers);
    organization = modpack.organization ? await getOrganization(modpack.organization) : null;
    if ((await isProjectBlocked(modpack.slug, modpack.id) || isOrganizationBlocked(modpack.organization))) notFound()
  } catch (error) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <IconPreload iconUrl={modpack.icon_url} />
      <ResourceHeader resource={modpack} contentType="modpack" versions={versions} />
      
      <ContentNavigationWithBanner resource={modpack} contentType="modpack" versionsCount={versions.length} galleryCount={modpack.gallery?.length || 0} projectColor={modpack.color} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <VersionsList versions={versions} contentType="modpack" slug={slug} initialLoader={initialLoader} projectColor={modpack.color} />
        </div>

        <ResourceSidebarContainer resource={modpack} organization={organization} teamMembers={teamMembers} />
      </div>
    </div>
  )
}
