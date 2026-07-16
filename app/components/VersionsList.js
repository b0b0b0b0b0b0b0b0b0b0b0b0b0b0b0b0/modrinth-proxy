'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { compressVersionRanges, resolveModrinthProjectAccent } from '@/lib/modrinth'
import { versionChannelLetterRingClass } from '@/lib/versionChannelStyles'
import { compareMinecraftVersionsDesc } from '@/lib/minecraftVersionSort'
import {
  filterVersionsByContentType,
  getVersionGameVersions,
  getVersionPlatformIds,
} from '@/lib/contextualVersions'
import { LOADERS } from '@/lib/loaders'
import VersionsDropdown from './VersionsDropdown'
import LoadersDropdown from './LoadersDropdown'
import ChannelsDropdown from './ChannelsDropdown'
import RelativeTime from './RelativeTime'
import DownloadsCompactTooltip from './DownloadsCompactTooltip'
import VersionEnvironmentDisplay from './VersionEnvironmentDisplay'

const ROW_GRID_XL_WITH_ENV =
  'xl:grid-cols-[40px_minmax(150px,1fr)_minmax(100px,200px)_minmax(100px,200px)_minmax(48px,68px)_minmax(100px,150px)_minmax(80px,100px)_40px]'
const ROW_GRID_XL_NO_ENV =
  'xl:grid-cols-[40px_minmax(150px,1fr)_minmax(100px,200px)_minmax(100px,200px)_minmax(100px,150px)_minmax(80px,100px)_40px]'
const ROW_GRID_XL_RESOURCEPACK =
  'xl:grid-cols-[40px_minmax(150px,1fr)_minmax(100px,200px)_minmax(100px,150px)_minmax(80px,100px)_40px]'

export default function VersionsList({
  versions,
  contentType,
  slug,
  initialLoader = 'all',
  projectColor,
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => setThemeMounted(true), [])

  const accent = useMemo(
    () => resolveModrinthProjectAccent(projectColor),
    [projectColor],
  )
  const paginationAccent =
    themeMounted && accent && resolvedTheme === 'dark' ? accent : null

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMcVersions, setSelectedMcVersions] = useState([])
  const [selectedLoaders, setSelectedLoaders] = useState([])
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [showOnlyReleases, setShowOnlyReleases] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const versionsPerPage = 20

  const handleLoadersChange = (newLoaders) => {
    setSelectedLoaders(newLoaders)
    setCurrentPage(1)
  }

  const handleLoaderClick = (e, loaderId) => {
    e.stopPropagation()
    if (selectedLoaders.includes(loaderId)) {
      handleLoadersChange(selectedLoaders.filter(l => l !== loaderId))
    } else {
      handleLoadersChange([...selectedLoaders, loaderId])
    }
  }

  const handleVersionsChange = (nextVersions) => {
    setSelectedMcVersions(nextVersions)
    setCurrentPage(1)
  }

  const handleShowOnlyReleasesChange = (value) => {
    setShowOnlyReleases(value)
    setCurrentPage(1)
  }

  const handleChannelChange = (channel) => {
    setSelectedChannel(channel)
    setCurrentPage(1)
  }

  const contextualVersions = useMemo(
    () => filterVersionsByContentType(versions, contentType),
    [versions, contentType],
  )

  const mcVersions = useMemo(() => {
    const versionsSet = new Set()
    contextualVersions.forEach(v => {
      getVersionGameVersions(v).forEach(gv => versionsSet.add(gv))
    })
    const sorted = Array.from(versionsSet).sort(compareMinecraftVersionsDesc)
    return sorted
  }, [contextualVersions])

  const loaders = useMemo(() => {
    const loadersSet = new Set()
    contextualVersions.forEach(v => {
      getVersionPlatformIds(v).forEach(l => loadersSet.add(l))
    })
    return Array.from(loadersSet)
  }, [contextualVersions])

  const channelTypesPresent = useMemo(() => {
    const s = new Set()
    contextualVersions.forEach((v) => {
      if (v.version_type == null) return
      const t = String(v.version_type).toLowerCase().replace(/\s+/g, '_')
      if (t) s.add(t)
    })
    return s
  }, [contextualVersions])

  useEffect(() => {
    setSelectedChannel((ch) => {
      if (channelTypesPresent.size <= 1) return 'all'
      if (ch === 'all') return ch
      return channelTypesPresent.has(ch) ? ch : 'all'
    })
  }, [channelTypesPresent])

  const showChannelFilter = channelTypesPresent.size > 1

  const releaseVersions = useMemo(() => {
    return mcVersions.filter(v => {
      return /^\d+\.\d+(\.\d+)?$/.test(v)
    })
  }, [mcVersions])

  const hasSnapshotVersions = releaseVersions.length < mcVersions.length

  useEffect(() => {
    if (!showOnlyReleases) return
    setSelectedMcVersions((prev) => {
      const next = prev.filter((v) => releaseVersions.includes(v))
      return next.length === prev.length ? prev : next
    })
  }, [showOnlyReleases, releaseVersions])

  const filteredVersions = useMemo(() => {
    return contextualVersions.filter(version => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = version.name.toLowerCase().includes(query)
        const matchVersion = version.version_number?.toLowerCase().includes(query)
        if (!matchName && !matchVersion) return false
      }

      if (selectedMcVersions.length > 0) {
        const gameVersions = getVersionGameVersions(version)
        if (!selectedMcVersions.some((v) => gameVersions.includes(v))) return false
      }

      if (showOnlyReleases && selectedMcVersions.length === 0) {
        const hasReleaseVersion = getVersionGameVersions(version).some(v => releaseVersions.includes(v))
        if (!hasReleaseVersion) return false
      }

      if (selectedLoaders.length > 0) {
        const hasSelectedLoader = getVersionPlatformIds(version).some(l => selectedLoaders.includes(l))
        if (!hasSelectedLoader) return false
      }

      if (selectedChannel !== 'all') {
        const t =
          version.version_type != null
            ? String(version.version_type).toLowerCase().replace(/\s+/g, '_')
            : ''
        if (t !== selectedChannel) return false
      }

      return true
    })
  }, [contextualVersions, searchQuery, selectedMcVersions, selectedLoaders, selectedChannel, showOnlyReleases, releaseVersions])

  const totalPages = Math.ceil(filteredVersions.length / versionsPerPage)
  const paginatedVersions = filteredVersions.slice(
    (currentPage - 1) * versionsPerPage,
    currentPage * versionsPerPage
  )

  const showEnvironment = contentType === 'plugin'
  const showPlatforms = contentType !== 'resourcepack'

  let gridRowXl = ROW_GRID_XL_NO_ENV
  if (showEnvironment) gridRowXl = ROW_GRID_XL_WITH_ENV
  else if (!showPlatforms) gridRowXl = ROW_GRID_XL_RESOURCEPACK

  return (
    <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="space-y-3 md:space-y-4 mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск версий..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded text-sm border border-gray-700 focus:border-modrinth-green focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 text-sm md:text-base">
            {showPlatforms && loaders.length > 0 && (
              <LoadersDropdown 
                loaders={loaders}
                selectedLoaders={selectedLoaders}
                onLoadersChange={handleLoadersChange}
              />
            )}

            <VersionsDropdown 
              versions={showOnlyReleases ? releaseVersions : mcVersions}
              selectedVersions={selectedMcVersions}
              onVersionsChange={handleVersionsChange}
              showOnlyReleases={showOnlyReleases}
              onShowOnlyReleasesChange={handleShowOnlyReleasesChange}
              hasSnapshotVersions={hasSnapshotVersions}
            />

            {showChannelFilter && (
              <ChannelsDropdown 
                selectedChannel={selectedChannel}
                onChannelChange={handleChannelChange}
                channelTypesPresent={channelTypesPresent}
              />
            )}


            <div className="text-sm text-gray-400 flex items-center ml-auto">
              {filteredVersions.length} версий
            </div>
          </div>
        </div>
        
        <div
          className={`hidden sm:grid grid-cols-[40px_minmax(150px,1fr)_minmax(120px,180px)_minmax(100px,150px)_40px] gap-3 px-3 py-2 text-sm font-bold text-gray-300 border-b border-gray-800 ${gridRowXl}`}
        >
          <div></div>
          <div>Название</div>
          <div className="xl:hidden">Compatibility</div>
          <div className="xl:hidden">Стата</div>
          <div className="hidden xl:block">Версии игры</div>
          {showPlatforms && <div className="hidden xl:block">Платформы</div>}
          {showEnvironment && <div className="hidden xl:block text-center">Среда</div>}
          <div className="hidden xl:block">Опубликовано</div>
          <div className="hidden xl:block">Загрузок</div>
          <div></div>
        </div>

        {filteredVersions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Версии не найдены</p>
        ) : (
          <>
            <div>
              {paginatedVersions.map((version, index) => {
              const primaryFile = version.files.find(f => f.primary) || version.files[0]
              const versionTypeColor = versionChannelLetterRingClass(version.version_type)
              
              return (
                <div key={version.id}>
                  <div className="group relative">
                    <div className="px-3 py-2">
                      <div className={`grid grid-cols-[40px_1fr_40px] max-[390px]:flex max-[390px]:flex-col max-[390px]:items-center sm:grid sm:grid-cols-[40px_minmax(150px,1fr)_minmax(120px,180px)_minmax(100px,150px)_40px] gap-3 items-center ${gridRowXl}`}>
                        <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[18px] font-bold ${versionTypeColor}`}>
                          {version.version_type[0].toUpperCase()}
                        </div>

                        <Link 
                          href={`/${contentType}/${slug}/version/${version.id}`}
                          className="relative z-10 min-w-0 max-[390px]:text-center group-hover:underline"
                        >
                          <div className="font-bold text-sm">{version.version_number || version.name}</div>
                          {version.name && (
                            <div className="text-xs font-medium text-gray-400">{version.name}</div>
                          )}
                        </Link>

                      <div className="relative z-10 hidden sm:flex xl:hidden flex-wrap gap-1 items-start content-start">
                        {compressVersionRanges(version.game_versions).slice(0, 2).map((range, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                          >
                            {range}
                          </span>
                        ))}
                        {showPlatforms &&
                          getVersionPlatformIds(version).map((loaderId) => {
                          const loaderData = LOADERS.find(l => l.id === loaderId)
                          if (!loaderData) return null
                          
                          return (
                            <span 
                              key={loaderId}
                              onClick={(e) => handleLoaderClick(e, loaderId)}
                              className="px-2 py-1 text-xs font-semibold rounded-full hover:underline cursor-pointer capitalize inline-flex items-center gap-1 relative z-10"
                              style={{ 
                                backgroundColor: 'var(--bg-tertiary)', 
                                color: loaderData.color || 'var(--text-muted)' 
                              }}
                            >
                              <div className="w-3 h-3 flex-shrink-0" style={{ color: loaderData.color || 'var(--text-muted)' }}>
                                {loaderData.icon}
                              </div>
                              {loaderData.name}
                            </span>
                          )
                        })}
                      </div>

                      <div className="relative z-10 hidden sm:flex xl:hidden flex-col gap-1 text-xs text-gray-400 font-medium">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2"></path>
                          </svg>
                          <RelativeTime dateString={version.date_published} />
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <DownloadsCompactTooltip downloads={version.downloads} />
                        </div>
                        {showEnvironment && (
                          <VersionEnvironmentDisplay
                            environment={version.environment}
                            className="text-xs text-gray-500 line-clamp-2 font-medium"
                          />
                        )}
                      </div>

                      <div className="relative z-10 hidden xl:flex flex-wrap gap-1 items-start content-start">
                        {compressVersionRanges(version.game_versions).map((range, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                          >
                            {range}
                          </span>
                        ))}
                      </div>

                      {showPlatforms && (
                        <div className="relative z-10 hidden xl:flex flex-wrap gap-1 items-start content-start">
                          {getVersionPlatformIds(version).map((loaderId) => {
                            const loaderData = LOADERS.find(l => l.id === loaderId)
                            if (!loaderData) return null
                            
                            return (
                              <span 
                                key={loaderId}
                                onClick={(e) => handleLoaderClick(e, loaderId)}
                                className="px-2 py-1 text-xs font-semibold rounded-full hover:underline cursor-pointer capitalize inline-flex items-center gap-1 relative z-10"
                                style={{ 
                                  backgroundColor: 'var(--bg-tertiary)', 
                                  color: loaderData.color || 'var(--text-muted)' 
                                }}
                              >
                                <div className="w-3 h-3 flex-shrink-0" style={{ color: loaderData.color || 'var(--text-muted)' }}>
                                  {loaderData.icon}
                                </div>
                                {loaderData.name}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {showEnvironment && (
                        <div className="relative z-10 hidden xl:flex items-center justify-center px-0.5 text-xs text-gray-400 font-medium min-w-0">
                          <VersionEnvironmentDisplay
                            environment={version.environment}
                            compactTableColumn
                          />
                        </div>
                      )}

                      <div className="relative z-10 pointer-events-none hidden xl:flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <span className="pointer-events-auto inline-block min-w-0">
                          <RelativeTime dateString={version.date_published} />
                        </span>
                      </div>

                      <div className="relative z-10 pointer-events-none hidden xl:flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <span className="pointer-events-auto inline-block min-w-0">
                          <DownloadsCompactTooltip downloads={version.downloads} />
                        </span>
                      </div>

                        <div className="relative z-10 sm:hidden flex flex-col gap-1 text-xs text-gray-400 font-medium mt-2 max-[390px]:items-center max-[390px]:justify-center min-[391px]:col-span-2">
                          <div className="flex flex-wrap gap-1 max-[390px]:justify-center">
                            {compressVersionRanges(version.game_versions).slice(0, 2).map((range, i) => (
                              <span key={i} className="px-2 py-0.5 text-xs rounded-full whitespace-nowrap" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                                {range}
                              </span>
                            ))}
                          </div>
                          {showPlatforms && (
                            <div className="flex flex-wrap gap-1 max-[390px]:justify-center">
                              {getVersionPlatformIds(version).map((loaderId) => {
                                const loaderData = LOADERS.find(l => l.id === loaderId)
                                if (!loaderData) return null
                                
                                return (
                                  <span 
                                    key={loaderId}
                                    onClick={(e) => handleLoaderClick(e, loaderId)}
                                    className="px-2 py-0.5 text-xs rounded-full hover:underline cursor-pointer capitalize inline-flex items-center gap-1 relative z-10" 
                                    style={{ 
                                      backgroundColor: 'var(--bg-tertiary)', 
                                      color: loaderData.color || 'var(--text-muted)' 
                                    }}
                                  >
                                    <div className="w-3 h-3 flex-shrink-0" style={{ color: loaderData.color || 'var(--text-muted)' }}>
                                      {loaderData.icon}
                                    </div>
                                    {loaderData.name}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                          <div className="flex gap-2 max-[390px]:justify-center">
                            <RelativeTime dateString={version.date_published} />
                            <span>•</span>
                            <DownloadsCompactTooltip downloads={version.downloads} />
                          </div>
                          {showEnvironment && (
                            <VersionEnvironmentDisplay
                              environment={version.environment}
                              className="text-xs font-medium text-gray-500 max-[390px]:text-center line-clamp-2 w-full"
                            />
                          )}
                        </div>

                        {primaryFile && (
                          <a
                            href={primaryFile.url}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="relative z-10 flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-modrinth-green hover:text-black transition-all group/btn max-[390px]:mx-auto sm:mx-0"
                            title="Скачать"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < paginatedVersions.length - 1 && (
                    <div className="h-px w-full bg-gray-800 my-2" />
                  )}
                </div>
              )
            })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Назад
                </button>

                <div className="flex items-center gap-2">
                  {currentPage > 2 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                      >
                        1
                      </button>
                      {currentPage > 3 && <span className="text-gray-500">...</span>}
                    </>
                  )}

                  {currentPage > 1 && (
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                    >
                      {currentPage - 1}
                    </button>
                  )}

                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold ${
                      paginationAccent
                        ? 'hover:!brightness-[1.08]'
                        : 'bg-modrinth-green text-black'
                    }`}
                    style={
                      paginationAccent
                        ? {
                            backgroundColor: paginationAccent.accentHex,
                            color: paginationAccent.activeFgHex,
                          }
                        : undefined
                    }
                  >
                    {currentPage}
                  </div>

                  {currentPage < totalPages && (
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                    >
                      {currentPage + 1}
                    </button>
                  )}

                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <span className="text-gray-500">...</span>}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  Вперёд
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
