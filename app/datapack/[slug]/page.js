import { notFound } from 'next/navigation'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { getMod, getModVersions, getTeamMembers, getOrganization } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import MarkdownContent from '@/app/components/MarkdownContent'

export async function generateMetadata({ params }) {
  try {
    const pack = await getMod(params.slug)
    const url = `https://modrinth.black/datapack/${params.slug}`
    const fullDescription = pack.description || `Скачать ${pack.title} для Minecraft. ${formatDownloads(pack.downloads)} загрузок. Поддержка версий: ${pack.game_versions?.slice(0, 3).join(', ')}.`
    
    return {
      title: `${pack.title} - Майнкрафт Датапак`,
      description: fullDescription,
      robots: 'all',
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title: `${pack.title} - Майнкрафт Датапак`,
        description: pack.description,
        images: pack.icon_url ? [{ url: pack.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${pack.title} - Майнкрафт Датапак`,
        description: pack.description,
        images: pack.icon_url ? [pack.icon_url] : [],
      },
      other: {
        'theme-color': '#1bd96a',
      },
    }
  } catch {
    return {
      title: 'Датапак не найден | ModrinthProxy',
      description: 'Запрашиваемый датапак не найден',
    }
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
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={pack} contentType="datapack" versions={versions} />
      
      <ContentNavigationWithBanner resource={pack} contentType="datapack" versionsCount={versions.length} galleryCount={pack.gallery?.length || 0} projectColor={pack.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <MarkdownContent className="prose prose-invert prose-sm max-w-none" content={pack.body} />
            </div>
          </div>
        </div>
        
        <ResourceSidebarContainer resource={pack} organization={organization} teamMembers={teamMembers} contentType="datapack" />
      </div>
    </div>
  )
}
