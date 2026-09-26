import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { getMod, getModVersions, getTeamMembers, formatDownloads, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import MarkdownContent from '@/app/components/MarkdownContent'

export async function generateMetadata({ params }) {
  try {
    const modpack = await getMod(params.slug)
    const url = `https://modrinth.black/modpack/${params.slug}`
    const fullDescription = modpack.description || `Скачать ${modpack.title} для Minecraft. ${formatDownloads(modpack.downloads)} загрузок. Поддержка версий: ${modpack.game_versions?.slice(0, 3).join(', ')}.`
    
    return {
      title: `${modpack.title} - Майнкрафт Модпак`,
      description: fullDescription,
      robots: 'all',
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${modpack.title} - Майнкрафт Модпак`,
        description: modpack.description,
        images: modpack.icon_url ? [{ url: modpack.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${modpack.title} - Майнкрафт Модпак`,
        description: modpack.description,
        images: modpack.icon_url ? [modpack.icon_url] : [],
      },
      other: {
        'theme-color': '#1bd96a',
      },
    }
  } catch {
    return {
      title: 'Модпак не найден | ModrinthProxy',
      description: 'Запрашиваемый модпак не найден',
    }
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
