'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveLoader } from '@/lib/loaders'
import { projectEnvironments } from '@/lib/modrinth'
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
import ProjectLinksCard from './ProjectLinksCard'
import ProjectDependentsCard from './ProjectDependentsCard'
import { DisclosureIcon } from './ProjectDisclosureIcons'
import { useI18n, useT } from './I18nProvider'
import { formatRelative } from './RelativeTime'
import { intlLocale } from '@/lib/i18n/config'

function contentTypeFromPathname(pathname) {
  const match = pathname?.match(/^\/(mod|plugin|datapack|shader|resourcepack|modpack)\//)
  return match?.[1] ?? null
}

export default function ResourceSidebar({ resource, teamMembers = [], organization = null, contentType = null, disclosureItems = null }) {
  const t = useT()
  const { locale } = useI18n()
  const pathname = usePathname()
  const resolvedContentType = contentType ?? contentTypeFromPathname(pathname)
  const authorMembers =
    teamMembers.length > 0
      ? teamMembers
      : (organization?.members ?? [])
  const gameVersions = resource.minecraft_java_server?.content?.supported_game_versions || resource.game_versions || []
  const allowedLoaderIds = resolvedContentType ? buildAllowedLoaderIds(resolvedContentType) : null
  const projectTypes = Array.isArray(resource.project_types)
    ? resource.project_types
    : resource.project_type
      ? [resource.project_type]
      : []
  const loaders = [
    ...(resource.loaders || []),
    ...(projectTypes.includes('resourcepack') && !(resource.loaders || []).includes('minecraft')
      ? ['minecraft']
      : []),
  ]
    .filter((l, index, arr) => arr.indexOf(l) === index)
    .filter((l) => {
      if (l === 'datapack' && resolvedContentType !== 'datapack') return false
      if (l === 'minecraft' && resolvedContentType !== 'datapack' && resolvedContentType !== 'resourcepack') return false
      return true
    })
    .filter(l => !allowedLoaderIds?.size || allowedLoaderIds.has(l))
  const browseRoute = resolveContentTypeRoute(resolvedContentType, resource.project_type)
  const gameVersionRanges = compressSidebarGameVersions(gameVersions)

  const environment = ENV_HIDDEN_ROUTES.has(browseRoute) ? null : getEnvironment(resource)
  const envLinkable = ENV_FILTER_ROUTES.has(browseRoute)
  const alternateFormatRaw = resolveAlternateProjectFormat({
    project: resource,
    contentType: resolvedContentType,
  })
  const alternateFormat = alternateFormatRaw
    ? {
        ...alternateFormatRaw,
        tooltip: t(alternateFormatRaw.href.startsWith('/plugin/') ? 'dl.altPlugin' : 'dl.altMod'),
        linkLabel: t(alternateFormatRaw.href.startsWith('/plugin/') ? 'dl.altPluginOpen' : 'dl.altModOpen'),
      }
    : null
  const projectId = resource.id ?? resource.project_id
  const hasGitHubSource = Boolean(parseGitHubRepoFromSourceUrl(resource.source_url))

  return (
    <div className="space-y-4">
      {(gameVersions.length > 0 || loaders.length > 0 || environment) && (
        <div className="ny-snow-host bg-modrinth-dark card-glass rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('project.compatibility')}
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
                <h3 className="text-base font-bold m-0 mb-2 text-[var(--text-gray)]">{t('project.platforms')}</h3>
                <div className="flex flex-wrap gap-2">
                  {loaders.map((loaderId) => {
                    const loader = resolveLoader(loaderId)
                    
                    const contentTypeRoute = browseRoute
                    const filterUrl = `/${contentTypeRoute}?g=categories:${loaderId}`
                    
                    return (
                      <StyledTooltip
                        key={loaderId}
                        label={t('project.viewInCatalog', { name: loader.name })}
                      >
                        <Link
                          href={filterUrl}
                          className="glass-chip flex items-center gap-1.5 px-2.5 py-1.5 rounded-full group"
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
                <h3 className="text-base font-bold m-0 mb-2 text-[var(--text-gray)]">{t('project.environments')}</h3>
                <div className="flex flex-wrap gap-2">
                  {environment.map((side) => {
                    const chipClass = 'glass-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm leading-none text-[var(--text-muted)]'
                    const content = (
                      <>
                        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                          {ENV_ICONS[side]}
                        </svg>
                        {t(`filter.env.${side}`)}
                      </>
                    )
                    if (envLinkable && (side === 'client' || side === 'server')) {
                      return (
                        <Link key={side} href={`/${browseRoute}?e=${side}`} className={`${chipClass} hover:text-[var(--text-primary)]`}>
                          {content}
                        </Link>
                      )
                    }
                    return (
                      <span key={side} className={chipClass}>
                        {content}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {alternateFormat && (
        <div className="ny-snow-host bg-modrinth-dark card-glass rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 text-[var(--text-gray)] text-center">{t('project.also')}</h3>
          <div className="flex justify-center">
            <AlternateProjectFormatLink {...alternateFormat} />
          </div>
        </div>
      )}

      <ProjectDependentsCard
        projectId={projectId}
        projectType={resource.project_type}
        loaders={resource.loaders || []}
        title={resource.title}
      />

      {resource.project_type === 'minecraft_java_server' && (
        <div className="ny-snow-host bg-modrinth-dark card-glass rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 012-2h10a2 2 0 012 2m-14 0a2 2 0 002 2h10a2 2 0 002-2M7 8l-2 2 2 2m8-4l2 2-2 2" />
            </svg>
            {t('project.aboutServer')}
          </h3>
          <div className="space-y-3 text-xs md:text-sm">
            {resource.minecraft_server?.region && (
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">{t('project.region')}</span>
                <span className="font-semibold text-white uppercase">{resource.minecraft_server.region}</span>
              </div>
            )}
            {resource.minecraft_server?.languages && resource.minecraft_server.languages.length > 0 && (
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">{t('project.languages')}</span>
                <span className="font-semibold text-white uppercase">{resource.minecraft_server.languages.join(', ')}</span>
              </div>
            )}
            {(resource.minecraft_java_server?.ping?.data?.version_name ?? resource.minecraft_java_server?.ping?.version_name) && (
              <div className="flex justify-between border-b border-gray-800 pb-1.5">
                <span className="font-semibold text-[var(--text-gray)]">{t('project.core')}</span>
                <span className="font-semibold text-white text-right truncate max-w-[160px]">{resource.minecraft_java_server.ping.data?.version_name ?? resource.minecraft_java_server.ping.version_name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <ProjectLinksCard resource={resource} />

      {hasGitHubSource && (
        <GitHubSidebarSection sourceUrl={resource.source_url} />
      )}

      {(organization || authorMembers.length > 0) && (
        <div className="ny-snow-host bg-modrinth-dark card-glass rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('project.authors')}
          </h3>
          <AuthorsSection organization={organization} members={authorMembers} />
        </div>
      )}

      <div className="ny-snow-host bg-modrinth-dark card-glass rounded-lg p-4">
        <h3 className="text-lg font-bold m-0 mb-3 text-[var(--text-primary)]">
          {t('project.details')}
        </h3>
        <div className="flex flex-col gap-3 text-sm [&>div>svg]:shrink-0 [&>div>svg]:mt-px [&>div]:flex [&>div]:gap-2 [&>div]:items-start [&>div>div]:min-w-0">
          {disclosureItems}

          {resource.license && (resource.license.id || resource.license.name) && (
            <div className="flex gap-2 items-start text-[var(--text-primary)]">
              <DisclosureIcon type="license" className="w-6 h-6 shrink-0 mt-px text-modrinth-green" />
              <div className="min-w-0">
                <span>{t('project.license')}</span>
                <LicenseLink license={resource.license} />
              </div>
            </div>
          )}

          {resource.published && (
            <StyledTooltip label={formatExactDate(resource.published, locale)}>
              <div className="flex gap-2 items-start text-[var(--text-primary)] cursor-default">
                <DisclosureIcon type="published" className="w-6 h-6 shrink-0 mt-px text-modrinth-green" />
                <div>{t('project.published', { when: formatRelative(resource.published, t) })}</div>
              </div>
            </StyledTooltip>
          )}

          {resource.updated && (
            <StyledTooltip label={formatExactDate(resource.updated, locale)}>
              <div className="flex gap-2 items-start text-[var(--text-primary)] cursor-default">
                <DisclosureIcon type="updated" className="w-6 h-6 shrink-0 mt-px text-modrinth-green" />
                <div>{t('project.updated', { when: formatRelative(resource.updated, t) })}</div>
              </div>
            </StyledTooltip>
          )}

          {projectId && (
            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-800">
              <span className="font-semibold text-[var(--text-gray)]">{t('project.projectId')}</span>
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
  const t = useT()
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
        label={t('project.copyPermalink')}
        tooltipLabel={t('project.copyPermalinkTip')}
      />
    </div>
  )
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

const ENV_FILTER_ROUTES = new Set(['mods', 'modpacks'])
const ENV_HIDDEN_ROUTES = new Set(['resourcepacks', 'shaders'])

const ENV_ICONS = {
  client: <path d="M9.75 17 9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />,
  server: <path d="M22 12H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11M6 16h.01M10 16h.01" />,
  singleplayer: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  both: (
    <>
      <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8M10 19v-3.96 3.15M7 19h5" />
      <rect width="6" height="10" x="16" y="12" rx="2" />
    </>
  ),
}

function getEnvironment(resource) {
  if (resource.project_type === 'minecraft_java_server' || resource.minecraft_java_server) return null
  const fromEnv = projectEnvironments(resource.environment)
  if (fromEnv.length > 0) return fromEnv
  const sides = []
  if (resource.client_side === 'required' || resource.client_side === 'optional') sides.push('client')
  if (resource.server_side === 'required' || resource.server_side === 'optional') sides.push('server')
  return sides.length > 0 ? sides : null
}

function formatExactDate(dateString, locale) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleString(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
