import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServer, getOrganization, getTeamMembers, getVersion, formatDate } from '@/lib/modrinth'
import { filterModContent, filterTeamMembers, isProjectBlocked, isOrganizationBlocked } from '@/lib/contentFilter'
import { getFilterConfig, getCategoryName } from '@/lib/filterConfig'
import { buildServerPageMetadata, buildServerNotFoundMetadata } from '@/lib/serverPageSeo'
import { SERVER_CATEGORY_TAG_CLASS } from '@/lib/serverTagStyles'
import ResourceHeader from '@/app/components/ResourceHeader'
import ServerSidebarDetails from '@/app/components/ServerSidebarDetails'
import ServerGallery from '@/app/components/ServerGallery'
import ServerSidebarLink from '@/app/components/ServerSidebarLink'
import ServerLinkIcon from '@/app/components/ServerLinkIcon'
import AuthorsSection from '@/app/components/AuthorsSection'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export async function generateMetadata({ params }) {
  try {
    const server = await getServer(params.slug)
    return buildServerPageMetadata(server, params.slug)
  } catch {
    return buildServerNotFoundMetadata()
  }
}

export default async function ServerPage({ params }) {
  const { slug } = params;
  
  if (isProjectBlocked(slug)) {
    return (
      <div className="text-center py-16 max-w-2xl mx-auto">
        <div className="mb-6">
          <svg className="w-20 h-20 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-3xl font-bold text-red-500 mb-4">Доступ ограничен</h1>
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-6 mb-6 text-left">
            <p className="text-gray-300 mb-3">
              Данный проект недоступен в соответствии с региональными ограничениями и требованиями Роскомнадзора.
            </p>
            <p className="text-gray-400 text-sm">
              К сожалению, некоторые проекты были заблокированы на территории Российской Федерации по решению регулирующих органов. Мы вынуждены ограничить доступ к этому контенту для соблюдения действующего законодательства.
            </p>
          </div>
        </div>
        <Link 
          href="/servers"
          className="inline-flex items-center gap-2 bg-modrinth-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-modrinth-green-light transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Вернуться к серверам</span>
        </Link>
      </div>
    )
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

    if ((isProjectBlocked(server.slug, server.id) || isOrganizationBlocked(server.organization))) {
      return (
        <div className="text-center py-16 max-w-2xl mx-auto">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-3xl font-bold text-red-500 mb-4">Доступ ограничен</h1>
            <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-6 mb-6 text-left">
              <p className="text-gray-300 mb-3">
                Данный проект недоступен в соответствии с региональными ограничениями и требованиями Роскомнадзора.
              </p>
              <p className="text-gray-400 text-sm">
                К сожалению, некоторые проекты были заблокированы на территории Российской Федерации по решению регулирующих органов. Мы вынуждены ограничить доступ к этому контенту для соблюдения действующего законодательства.
              </p>
            </div>
          </div>
          <Link 
            href="/servers"
            className="inline-flex items-center gap-2 bg-modrinth-green hover:bg-modrinth-green-light text-black px-6 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Вернуться к серверам</span>
          </Link>
        </div>
      )
    }
  } catch (error) {
    notFound()
  }

  const getLinks = (srv) => {
    const list = []
    if (srv.discord_url) list.push({ name: 'Вступить в Discord', url: srv.discord_url, platform: 'discord' })
    if (srv.source_url) list.push({ name: 'Source Code', url: srv.source_url, platform: 'source' })
    if (srv.wiki_url) list.push({ name: 'Перейти в вики', url: srv.wiki_url, platform: 'wiki' })
    if (srv.issues_url) list.push({ name: 'Issues', url: srv.issues_url, platform: 'issues' })
    
    if (srv.link_urls) {
      Object.keys(srv.link_urls).forEach(key => {
        const item = srv.link_urls[key]
        if (item && item.url && !list.some(x => x.url === item.url)) {
          const platform = typeof item.platform === 'string' ? item.platform : ''
          let name = 'Link'
          if (platform === 'discord') name = 'Вступить в Discord'
          else if (platform === 'store') name = 'Перейти в магазин'
          else if (platform === 'wiki') name = 'Перейти в вики'
          else if (platform === 'issues') name = 'Issues'
          else if (platform === 'site' || platform === 'website') name = 'Перейти на сайт'
          else if (platform) {
            const rawName = platform.charAt(0).toUpperCase() + platform.slice(1)
            name = rawName === 'Site' || rawName === 'Website' ? 'Перейти на сайт' : rawName
          }
          list.push({ name, url: item.url, platform: platform || 'link' })
        }
      })
    }
    return list
  }

  const links = getLinks(server)
  const allTags = [...new Set([...(server.categories || []), ...(server.additional_categories || [])])]
  const filterConfig = getFilterConfig('servers')

  return (
    <div className="max-w-7xl mx-auto">
      <ResourceHeader resource={server} contentType="server" versions={[]} />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-4">
        <div className="min-w-0">
          <ServerGallery gallery={server.gallery} />
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {server.body || ''}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:sticky lg:top-4 lg:self-start flex flex-col gap-4">
          <ServerSidebarDetails server={server} requiredContentVersion={requiredContentVersion} />

          {links.length > 0 && (
            <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <h2 className="text-lg font-bold text-white m-0">Ссылки</h2>
              <div className="flex flex-col gap-3 font-semibold">
                {links.map((link, idx) => (
                  <ServerSidebarLink key={idx} link={link} icon={<ServerLinkIcon platform={link.platform} />} />
                ))}
              </div>
            </div>
          )}

          {allTags.length > 0 && (
            <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <h2 className="text-lg font-bold text-white m-0">Теги</h2>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <Link
                    key={tag}
                    href={`/discover/servers?sc=${tag}`}
                    className={SERVER_CATEGORY_TAG_CLASS}
                  >
                    {getCategoryName(tag, filterConfig)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(organization || (teamMembers && teamMembers.length > 0)) && (
            <div className="bg-modrinth-dark border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
              <h2 className="text-lg font-bold text-white m-0">Авторы</h2>
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

function formatTimeAgo(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  const intervals = [
    { seconds: 31536000, one: 'год', two: 'года', many: 'лет' },
    { seconds: 2592000, one: 'месяц', two: 'месяца', many: 'месяцев' },
    { seconds: 604800, one: 'неделю', two: 'недели', many: 'недель' },
    { seconds: 86400, one: 'день', two: 'дня', many: 'дней' },
    { seconds: 3600, one: 'час', two: 'часа', many: 'часов' },
    { seconds: 60, one: 'минуту', two: 'минуты', many: 'минут' },
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      const mod10 = count % 10
      const mod100 = count % 100
      let word = interval.many
      if (!(mod100 >= 11 && mod100 <= 19)) {
        if (mod10 === 1) word = interval.one
        else if (mod10 >= 2 && mod10 <= 4) word = interval.two
      }
      return `${count} ${word} назад`
    }
  }
  
  return 'только что'
}
