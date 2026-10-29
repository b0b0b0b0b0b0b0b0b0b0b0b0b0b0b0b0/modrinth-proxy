import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { permanentRedirect } from 'next/navigation'
import { getMod, getModVersions, getTeamMembers, getOrganization, formatDownloads, isModrinthNotFound } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import ResourceSidebarContainer from '@/app/components/ResourceSidebarContainer'
import ContentNavigationWithBanner from '@/app/components/ContentNavigationWithBanner'
import ResourceHeader from '@/app/components/ResourceHeader'
import RichMarkdownContent from '@/app/components/RichMarkdownContent'
import { getRequestT } from '@/lib/i18n/server'
import { notFoundOrThrow } from '@/lib/projectPageError'

export async function generateMetadata({ params }) {
  const { t } = getRequestT()
  try {
    const mod = await getMod(params.slug)
    if (mod.project_type === 'minecraft_java_server') {
      permanentRedirect(`/server/${params.slug}`)
    }
    const url = `https://modrinth.black/mod/${params.slug}`
    const fullDescription = mod.description || t('project.seoDesc', {
      title: mod.title,
      downloads: formatDownloads(mod.downloads),
      versions: mod.game_versions?.slice(0, 3).join(', ') || '',
    })
    const title = t('project.metaMod', { title: mod.title })
    
    return {
      title,
      description: fullDescription,
      keywords: mod.title ? t('project.downloadNamed', { title: mod.title }) : undefined,
      robots: 'all',
      openGraph: {
        siteName: 'modrinth.black',
        type: 'website',
        url: url,
        title,
        description: mod.description,
        images: mod.icon_url ? [{ url: mod.icon_url }] : [],
      },
      twitter: {
        card: 'summary',
        title,
        description: mod.description,
        images: mod.icon_url ? [mod.icon_url] : [],
      },
      other: {
        'theme-color': '#1bd96a',
      },
    }
  } catch (error) {
    if (!isModrinthNotFound(error)) return {}
    return {
      title: t('project.notFound'),
      description: t('project.notFoundDesc'),
    }
  }
}

export default async function ModPage({ params }) {
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/mods" backKey="project.backToMods" />
  }

  let mod, versions, teamMembers, organization;
  try {
    [mod, versions, teamMembers] = await Promise.all([
      getMod(slug),
      getModVersions(slug).catch(() => []),
      getTeamMembers(slug),
    ]);
    
    mod = filterModContent(mod);
    organization = mod.organization ? await getOrganization(mod.organization) : null;
    teamMembers = filterTeamMembers(teamMembers);

    if (mod.project_type === 'minecraft_java_server') {
      permanentRedirect(`/server/${slug}`)
    }
    
    if ((await isProjectBlocked(mod.slug, mod.id) || isOrganizationBlocked(mod.organization))) {
      return <ProjectAccessRestricted href="/mods" backKey="project.backToMods" />
    }
  } catch (error) {
    notFoundOrThrow(error)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={mod} contentType="mod" versions={versions} />
      
      <ContentNavigationWithBanner resource={mod} contentType="mod" versionsCount={versions.length || mod.versions?.length || 0} galleryCount={mod.gallery?.length || 0} projectColor={mod.color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <div className="bg-modrinth-dark card-glass rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <RichMarkdownContent className="prose prose-invert prose-sm max-w-none" content={mod.body} />
            </div>
          </div>
        </div>
        
        <ResourceSidebarContainer resource={mod} organization={organization} teamMembers={teamMembers} contentType="mod" />
      </div>
    </div>
  )
}
