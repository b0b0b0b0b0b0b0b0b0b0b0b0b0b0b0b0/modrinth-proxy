'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOADERS } from '@/lib/loaders'
import { buildAllowedLoaderIds } from '@/lib/contextualVersions'
import { resolveAlternateProjectFormat } from '@/lib/alternateProjectFormat'
import { compressSidebarGameVersions } from '@/lib/minecraftVersionSort'
import CompressedGameVersionsChips from './CompressedGameVersionsChips'
import CopyButton from './CopyButton'
import CopyLabeledButton from './CopyLabeledButton'
import GitHubSidebarSection from './GitHubSidebarSection'
import { parseGitHubRepoFromSourceUrl } from '@/lib/github'
import LicenseLink from './LicenseLink'
import AuthorsSection from './AuthorsSection'
import StyledTooltip from './StyledTooltip'
import AlternateProjectFormatLink from './AlternateProjectFormatLink'

function contentTypeFromPathname(pathname) {
  const match = pathname?.match(/^\/(mod|plugin|datapack|shader|resourcepack|modpack)\//)
  return match?.[1] ?? null
}

export default function ResourceSidebar({ resource, teamMembers = [], organization = null, contentType = null }) {
  const pathname = usePathname()
  const resolvedContentType = contentType ?? contentTypeFromPathname(pathname)
  const authorMembers =
    teamMembers.length > 0
      ? teamMembers
      : (organization?.members ?? [])
  const gameVersions = resource.minecraft_java_server?.content?.supported_game_versions || resource.game_versions || []
  const allowedLoaderIds = resolvedContentType ? buildAllowedLoaderIds(resolvedContentType) : null
  const loaders = (resource.loaders || [])
    .filter((l) => {
      if (l === 'minecraft') return false
      if (l === 'datapack' && resolvedContentType !== 'datapack') return false
      return true
    })
    .filter(l => !allowedLoaderIds?.size || allowedLoaderIds.has(l))
  const browseRoute = resolveContentTypeRoute(resolvedContentType, resource.project_type)
  const gameVersionRanges = compressSidebarGameVersions(gameVersions)

  const environment = getEnvironment(resource.client_side, resource.server_side)
  const alternateFormat = resolveAlternateProjectFormat({
    project: resource,
    contentType: resolvedContentType,
  })
  const projectId = resource.id ?? resource.project_id
  const hasGitHubSource = Boolean(parseGitHubRepoFromSourceUrl(resource.source_url))
  const showSourceInLinks = resource.source_url && !hasGitHubSource

  return (
    <div className="space-y-4">
      {(gameVersions.length > 0 || loaders.length > 0 || environment) && (
        <div className="bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Совместимость
          </h3>
          
          <div className="space-y-3">
            {gameVersions.length > 0 && (
              <div>
                <h3 className="text-base font-bold m-0 mb-2 text-[var(--text-gray)]">Minecraft: Java Edition</h3>
                <CompressedGameVersionsChips
                  browseRoute={browseRoute}
                  rawVersions={gameVersions}
                  ranges={gameVersionRanges}
                  maxVisible={12}
                />
              </div>
            )}

            {loaders.length > 0 && (
              <div>
                <h3 className="text-base font-bold m-0 mb-2 text-[var(--text-gray)]">Платформы</h3>
                <div className="flex flex-wrap gap-2">
                  {loaders.map((loaderId) => {
                    const loader = LOADERS.find(l => l.id === loaderId)
                    if (!loader) return null
                    
                    const contentTypeRoute = browseRoute
                    const filterUrl = `/${contentTypeRoute}?g=categories:${loaderId}`
                    
                    return (
                      <StyledTooltip
                        key={loaderId}
                        label={`Смотреть в каталоге · ${loader.name}`}
                      >
                        <Link
                          href={filterUrl}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div 
                            className="w-4 h-4 flex-shrink-0" 
                            style={loader.color ? { color: loader.color } : { color: 'var(--text-secondary)' }}
                          >
                            {loader.icon}
                          </div>
                          <span 
                            className="text-xs font-medium" 
                            style={loader.color ? { color: loader.color } : { color: 'var(--text-secondary)' }}
                          >
                            {loader.name}
                          </span>
                        </Link>
                      </StyledTooltip>
                    )
                  })}
                </div>
              </div>
            )}

            {environment && (
              <div>
                <h3 className="text-base font-bold m-0 mb-2 text-[var(--text-gray)]">Поддерживаемые окружения</h3>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg w-fit">
                  <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17v-4m0 0V9m0 4h.01" />
                  </svg>
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{environment}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {alternateFormat && (
        <div className="bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 text-[var(--text-gray)] text-center">А так же</h3>
          <div className="flex justify-center">
            <AlternateProjectFormatLink {...alternateFormat} />
          </div>
        </div>
      )}

      {resource.project_type === 'minecraft_java_server' && (
        <div className="bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 012-2h10a2 2 0 012 2m-14 0a2 2 0 002 2h10a2 2 0 002-2M7 8l-2 2 2 2m8-4l2 2-2 2" />
            </svg>
            О сервере
          </h3>
          <div className="space-y-3 text-xs md:text-sm">
            {resource.minecraft_server?.region && (
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">Регион</span>
                <span className="font-semibold text-white uppercase">{resource.minecraft_server.region}</span>
              </div>
            )}
            {resource.minecraft_server?.languages && resource.minecraft_server.languages.length > 0 && (
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">Языки</span>
                <span className="font-semibold text-white uppercase">{resource.minecraft_server.languages.join(', ')}</span>
              </div>
            )}
            {(resource.minecraft_java_server?.ping?.data?.version_name ?? resource.minecraft_java_server?.ping?.version_name) && (
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">Ядро/Версия</span>
                <span className="font-semibold text-white text-right truncate max-w-[160px]">{resource.minecraft_java_server.ping.data?.version_name ?? resource.minecraft_java_server.ping.version_name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(resource.discord_url || showSourceInLinks || resource.wiki_url || resource.issues_url || (resource.donation_urls && resource.donation_urls.length > 0)) && (
        <div className="bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Ссылки
          </h3>
          <div className="space-y-2">
            {resource.issues_url && (
              <a href={resource.issues_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-red-400 transition-colors group">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="group-hover:underline">Сообщить о проблеме</span>
                <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                </svg>
              </a>
            )}
            {showSourceInLinks && (
              <a href={resource.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-purple-400 transition-colors group">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6l-6 6 6 6M16 18l6-6-6-6" />
                </svg>
                <span className="group-hover:underline">Исходный код</span>
                <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                </svg>
              </a>
            )}
            {resource.wiki_url && (
              <a href={resource.wiki_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-orange-400 transition-colors group">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="group-hover:underline">Wiki</span>
                <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                </svg>
              </a>
            )}
            {resource.discord_url && (
              <a href={resource.discord_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-blue-400 transition-colors group">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="group-hover:underline">Вступить в Discord</span>
                <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                </svg>
              </a>
            )}
            
            {resource.donation_urls && resource.donation_urls.length > 0 && (
              <>
                <hr className="border-gray-300 dark:border-gray-700 my-2" />
                {resource.donation_urls.map((donation, idx) => (
                  <a key={idx} href={donation.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 hover:text-modrinth-green-light transition-colors group">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                    <span className="group-hover:underline">{translateDonationPlatform(donation.platform)}</span>
                    <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                    </svg>
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {hasGitHubSource && (
        <GitHubSidebarSection sourceUrl={resource.source_url} />
      )}

      {(organization || authorMembers.length > 0) && (
        <div className="bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Авторы
          </h3>
          <AuthorsSection organization={organization} members={authorMembers} />
        </div>
      )}

      <div className="bg-modrinth-dark border border-gray-800 rounded-lg p-4">
        <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Сведения
        </h3>
        <div className="space-y-2 text-sm">
          {resource.license && (resource.license.id || resource.license.name) && (
            <div>
              <span className="font-semibold text-[var(--text-gray)]">Лицензия:</span>
              <span className="ml-1">
                <LicenseLink license={resource.license} />
              </span>
            </div>
          )}
          {resource.published && (
            <div>
              <span className="font-semibold text-[var(--text-gray)]">Опубликован:</span>
              <span className="text-[var(--text-primary)] ml-1">{formatTimeAgo(resource.published)}</span>
            </div>
          )}
          {resource.updated && (
            <div>
              <span className="font-semibold text-[var(--text-gray)]">Обновлён:</span>
              <span className="text-[var(--text-primary)] ml-1">{formatTimeAgo(resource.updated)}</span>
            </div>
          )}
          {projectId && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-semibold text-[var(--text-gray)]">ID проекта:</span>
              <CopyButton text={projectId} inline />
            </div>
          )}
          {projectId && (
            <PermanentLinkCopyButton projectId={projectId} browseRoute={browseRoute} />
          )}
        </div>
      </div>
    </div>
  )
}

function PermanentLinkCopyButton({ projectId, browseRoute }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    const segment = browseRoute.replace(/s$/, '')
    setUrl(`${window.location.origin}/${segment}/${projectId}`)
  }, [browseRoute, projectId])

  if (!url) return null

  return (
    <div>
      <CopyLabeledButton
        text={url}
        label="Скопировать вечную ссылку"
        tooltipLabel="Скопировать ссылку по ID проекта в буфер обмена"
      />
    </div>
  )
}

function translateDonationPlatform(platform) {
  const platforms = {
    'Other': 'Донат',
    'Patreon': 'Patreon',
    'Ko-fi': 'Ko-fi',
    'PayPal': 'PayPal',
    'Open Collective': 'Open Collective',
    'GitHub Sponsors': 'GitHub Sponsors',
    'Buy Me a Coffee': 'Buy Me a Coffee'
  }
  return platforms[platform] || 'Донат'
}


function resolveContentTypeRoute(contentTypeProp, projectType) {
  const typeMap = {
    'mod': 'mods',
    'mods': 'mods',
    'plugin': 'plugins',
    'plugins': 'plugins',
    'modpack': 'modpacks',
    'modpacks': 'modpacks',
    'resourcepack': 'resourcepacks',
    'resourcepacks': 'resourcepacks',
    'shader': 'shaders',
    'shaders': 'shaders',
    'datapack': 'datapacks',
    'datapacks': 'datapacks',
    'minecraft_java_server': 'servers',
    'servers': 'servers',
    'server': 'servers'
  }

  if (contentTypeProp && typeMap[contentTypeProp]) {
    return typeMap[contentTypeProp]
  }

  if (projectType && typeMap[projectType]) {
    return typeMap[projectType]
  }

  return 'mods'
}

function getEnvironment(clientSide, serverSide) {
  if (!clientSide && !serverSide) return null

  const client = clientSide === 'required' || clientSide === 'optional'
  const server = serverSide === 'required' || serverSide === 'optional'

  if (client && server) return 'Клиент и сервер'
  if (client) return 'Клиент'
  if (server) return 'Сервер'

  return null
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString)
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
