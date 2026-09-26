'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveLoader } from '@/lib/loaders'
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

  const environment = getEnvironment(t, resource.client_side, resource.server_side)
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
        <div className="ny-snow-host bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
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
                <h3 className="text-base font-bold m-0 mb-2 text-[var(--text-gray)]">{t('project.environments')}</h3>
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
        <div className="ny-snow-host bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 text-[var(--text-gray)] text-center">{t('project.also')}</h3>
          <div className="flex justify-center">
            <AlternateProjectFormatLink {...alternateFormat} />
          </div>
        </div>
      )}

      {resource.project_type === 'minecraft_java_server' && (
        <div className="ny-snow-host bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
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
        <div className="ny-snow-host bg-modrinth-dark border border-gray-300 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-base font-bold m-0 mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('project.authors')}
          </h3>
          <AuthorsSection organization={organization} members={authorMembers} />
        </div>
      )}

      <div className="ny-snow-host bg-modrinth-dark border border-gray-800 rounded-lg p-4">
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

function getEnvironment(t, clientSide, serverSide) {
  if (!clientSide && !serverSide) return null

  const client = clientSide === 'required' || clientSide === 'optional'
  const server = serverSide === 'required' || serverSide === 'optional'

  if (client && server) return t('filter.env.both')
  if (client) return t('filter.env.client')
  if (server) return t('filter.env.server')

  return null
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
