import Link from 'next/link'
import ProjectAccessRestricted from '@/app/components/ProjectAccessRestricted'
import { notFound } from 'next/navigation'
import { getServer, getOrganization, getTeamMembers, getVersion } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import { getServerCategoryName } from '@/lib/serverCategories'
import { categoryLabel } from '@/lib/i18n/label'
import { buildServerPageMetadata, buildServerNotFoundMetadata } from '@/lib/serverPageSeo'
import { SERVER_CATEGORY_TAG_CLASS } from '@/lib/serverTagStyles'
import ResourceHeader from '@/app/components/ResourceHeader'
import ServerSidebarDetails from '@/app/components/ServerSidebarDetails'
import ServerGallery from '@/app/components/ServerGallery'
import ServerSidebarLink from '@/app/components/ServerSidebarLink'
import ServerLinkIcon from '@/app/components/ServerLinkIcon'
import AuthorsSection from '@/app/components/AuthorsSection'
import MarkdownContent from '@/app/components/MarkdownContent'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata({ params }) {
  try {
    const server = await getServer(params.slug)
    return buildServerPageMetadata(server, params.slug)
  } catch {
    return buildServerNotFoundMetadata()
  }
}

export default async function ServerPage({ params }) {
  const { t } = getRequestT()
  const { slug } = params;
  
  if (await isProjectBlocked(slug)) {
    return <ProjectAccessRestricted href="/servers" backKey="project.backToServers" />
  }

  let server, teamMembers, organization, requiredContentVersion = null;
  try {
    [server, teamMembers] = await Promise.all([
      getServer(slug),
      getTeamMembers(slug),
    ]);
    
    server = filterModContent(server);
    teamMembers = filterTeamMembers(teamMembers);
    organization = server.organization ? await getOrganization(server.organization) : null;
    
    if (server.minecraft_java_server?.content?.version_id) {
      try {
        requiredContentVersion = await getVersion(server.minecraft_java_server.content.version_id)
      } catch (e) {
        console.error('Failed to load required content version:', e)
      }
    }

    if ((await isProjectBlocked(server.slug, server.id) || isOrganizationBlocked(server.organization))) {
      return <ProjectAccessRestricted href="/servers" backKey="project.backToServers" />
    }
  } catch (error) {
    notFound()
  }

  const getLinks = (srv) => {
    const list = []
    if (srv.discord_url) list.push({ name: t('links.discord'), url: srv.discord_url, platform: 'discord' })
    if (srv.source_url) list.push({ name: t('links.source'), url: srv.source_url, platform: 'source' })
    if (srv.wiki_url) list.push({ name: t('server.linkWiki'), url: srv.wiki_url, platform: 'wiki' })
    if (srv.issues_url) list.push({ name: t('links.issues'), url: srv.issues_url, platform: 'issues' })
    
    if (srv.link_urls) {
      Object.keys(srv.link_urls).forEach(key => {
        const item = srv.link_urls[key]
        if (item && item.url && !list.some(x => x.url === item.url)) {
          const platform = typeof item.platform === 'string' ? item.platform : ''
          let name = t('links.title')
          if (platform === 'discord') name = t('links.discord')
          else if (platform === 'store') name = t('server.linkStore')
          else if (platform === 'wiki') name = t('server.linkWiki')
          else if (platform === 'issues') name = t('links.issues')
          else if (platform === 'site' || platform === 'website') name = t('server.linkSite')
          else if (platform) {
            const rawName = platform.charAt(0).toUpperCase() + platform.slice(1)
            name = rawName === 'Site' || rawName === 'Website' ? t('server.linkSite') : rawName
          }
          list.push({ name, url: item.url, platform: platform || 'link' })
        }
      })
    }
    return list
  }

  const links = getLinks(server)
  const allTags = [...new Set([...(server.categories || []), ...(server.additional_categories || [])])]

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={server} contentType="server" versions={[]} />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-4">
        <div className="min-w-0">
          <ServerGallery gallery={server.gallery} />
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <MarkdownContent className="prose prose-invert prose-sm max-w-none" content={server.body || ''} />
            </div>
          </div>
        </div>
        
        <div className="lg:sticky lg:top-4 lg:self-start flex flex-col gap-4">
          <ServerSidebarDetails server={server} requiredContentVersion={requiredContentVersion} />

          {links.length > 0 && (
            <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <h2 className="text-lg font-bold text-white m-0">{t('links.title')}</h2>
              <div className="flex flex-col gap-3 font-semibold">
                {links.map((link, idx) => (
                  <ServerSidebarLink key={idx} link={link} icon={<ServerLinkIcon platform={link.platform} />} />
                ))}
              </div>
            </div>
          )}

          {allTags.length > 0 && (
            <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <h2 className="text-lg font-bold text-white m-0">{t('project.tags')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <Link
                    key={tag}
                    href={`/discover/servers?sc=${tag}`}
                    className={SERVER_CATEGORY_TAG_CLASS}
                  >
                    {categoryLabel(t, tag, getServerCategoryName(tag) || tag)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(organization || (teamMembers && teamMembers.length > 0)) && (
            <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <h2 className="text-lg font-bold text-white m-0">{t('project.authors')}</h2>
              <AuthorsSection
                organization={organization}
                members={teamMembers}
                linkClassName="!p-0 hover:!bg-transparent"
              />
            </div>
          )}        </div>
      </div>
    </div>
  )
}
