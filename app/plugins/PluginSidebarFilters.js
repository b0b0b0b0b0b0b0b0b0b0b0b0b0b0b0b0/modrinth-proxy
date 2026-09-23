'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMinecraftVersions } from '@/app/hooks/useMinecraftVersions'
import { getFilterConfig } from '@/lib/filterConfig'
import { parseVersionParams, appendVersionParams } from '@/lib/catalogVersionParams'
import { appendFacetParams, parseFacetList, pickIds, toggleExcluded, toggleIncluded } from '@/lib/catalogFacetParams'
import { appendDisclosureExclusionParams, catalogResetUrl, saveVisibleDisclosureExclusions } from '@/lib/disclosureExclusions'
import { copyOpenSourceParams, parseOpenSourceFilter, saveStoredOpenSource } from '@/lib/openSourceFilter'
import AdvancedExclusionsFilter from '@/app/components/AdvancedExclusionsFilter'
import LicenseFilter from '@/app/components/LicenseFilter'
import CatalogFilterOption from '@/app/components/CatalogFilterOption'
import { PLUGIN_PLATFORM_ID_LIST } from '@/lib/loaders'

const config = getFilterConfig('plugins')
const PLUGIN_LOADERS = config.loaders
const PLUGIN_PLATFORMS = config.platforms
const PLUGIN_CATEGORIES = config.categories

export default function PluginSidebarFilters({ isMobile = false, onFilterChange, initialVersions = null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hookVersions = useMinecraftVersions()
  const MC_VERSIONS_RELEASE = initialVersions?.release || hookVersions.release
  const MC_VERSIONS_FULL = initialVersions?.full || hookVersions.full
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedVersions, setSelectedVersions] = useState(parseVersionParams(searchParams))
  const [selectedLoaders, setSelectedLoaders] = useState([])
  const [excludedLoaders, setExcludedLoaders] = useState([])
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [excludedPlatforms, setExcludedPlatforms] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [excludedCategories, setExcludedCategories] = useState([])
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')

  useEffect(() => {
    const parsedFilters = parseFacets()
    const urlQuery = searchParams.get('q') || ''
    
    setSearchQuery(urlQuery)
    setSelectedVersions(parseVersionParams(searchParams))
    setSelectedLoaders(parsedFilters.loaders)
    setExcludedLoaders(parsedFilters.excludedLoaders)
    setSelectedPlatforms(parsedFilters.platforms)
    setExcludedPlatforms(parsedFilters.excludedPlatforms)
    setSelectedCategories(parsedFilters.categories)
    setExcludedCategories(parsedFilters.excludedCategories)
  }, [searchParams])

  const parseFacets = () => {
    const platformIds = PLUGIN_PLATFORM_ID_LIST
    const g = parseFacetList(searchParams.getAll('g'))
    const f = parseFacetList(searchParams.getAll('f'))
    return {
      loaders: g.included.filter((id) => !platformIds.includes(id)),
      excludedLoaders: g.excluded.filter((id) => !platformIds.includes(id)),
      platforms: pickIds(g.included, platformIds),
      excludedPlatforms: pickIds(g.excluded, platformIds),
      categories: f.included,
      excludedCategories: f.excluded,
    }
  }

  const updateFilters = (updates) => {
    const params = new URLSearchParams()
    
    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q)
    } else if (searchQuery) {
      params.set('q', searchQuery)
    }
    
    if (updates.v !== undefined) {
      appendVersionParams(params, updates.v)
    } else {
      appendVersionParams(params, parseVersionParams(searchParams))
    }

    const finalLoaders = updates.l !== undefined ? updates.l : selectedLoaders
    const finalExcludedLoaders = updates.xl !== undefined ? updates.xl : excludedLoaders
    const finalPlatforms = updates.p !== undefined ? updates.p : selectedPlatforms
    const finalExcludedPlatforms = updates.xp !== undefined ? updates.xp : excludedPlatforms
    const finalCategories = updates.c !== undefined ? updates.c : selectedCategories
    const finalExcludedCategories = updates.xc !== undefined ? updates.xc : excludedCategories

    appendFacetParams(params, 'g', [...finalLoaders, ...finalPlatforms], [...finalExcludedLoaders, ...finalExcludedPlatforms])
    appendFacetParams(params, 'f', finalCategories, finalExcludedCategories)

    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    copyOpenSourceParams(params, searchParams)
    appendDisclosureExclusionParams(params, searchParams, '/plugins')
    
    router.push(`/plugins?${params.toString()}`)
    onFilterChange?.()
  }

  const toggleVersion = (version) => {
    const next = selectedVersions.includes(version)
      ? selectedVersions.filter((v) => v !== version)
      : [...selectedVersions, version]
    setSelectedVersions(next)
    updateFilters({ v: next })
  }

  const toggleLoader = (loaderId) => {
    const next = toggleIncluded(loaderId, selectedLoaders, excludedLoaders)
    setSelectedLoaders(next.included)
    setExcludedLoaders(next.excluded)
    updateFilters({ l: next.included, xl: next.excluded })
  }

  const excludeLoader = (loaderId) => {
    const next = toggleExcluded(loaderId, selectedLoaders, excludedLoaders)
    setSelectedLoaders(next.included)
    setExcludedLoaders(next.excluded)
    updateFilters({ l: next.included, xl: next.excluded })
  }

  const togglePlatform = (platformId) => {
    const next = toggleIncluded(platformId, selectedPlatforms, excludedPlatforms)
    setSelectedPlatforms(next.included)
    setExcludedPlatforms(next.excluded)
    updateFilters({ p: next.included, xp: next.excluded })
  }

  const excludePlatform = (platformId) => {
    const next = toggleExcluded(platformId, selectedPlatforms, excludedPlatforms)
    setSelectedPlatforms(next.included)
    setExcludedPlatforms(next.excluded)
    updateFilters({ p: next.included, xp: next.excluded })
  }

  const toggleCategory = (categoryId) => {
    const next = toggleIncluded(categoryId, selectedCategories, excludedCategories)
    setSelectedCategories(next.included)
    setExcludedCategories(next.excluded)
    updateFilters({ c: next.included, xc: next.excluded })
  }

  const excludeCategory = (categoryId) => {
    const next = toggleExcluded(categoryId, selectedCategories, excludedCategories)
    setSelectedCategories(next.included)
    setExcludedCategories(next.excluded)
    updateFilters({ c: next.included, xc: next.excluded })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateFilters({ q: searchQuery })
  }

  return (
    <div className={isMobile ? "w-full" : "hidden lg:block w-80 flex-shrink-0"}>
      <div className="space-y-4">
        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Категории</h3>
          <div className="space-y-1.5 pr-2">
            {PLUGIN_CATEGORIES.map(cat => (
              <CatalogFilterOption
                key={cat.id}
                icon={cat.icon}
                label={cat.name}
                selected={selectedCategories.includes(cat.id)}
                excluded={excludedCategories.includes(cat.id)}
                onInclude={() => toggleCategory(cat.id)}
                onExclude={() => excludeCategory(cat.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Версия игры
          </h3>
          
          <div className="mb-2 relative">
            <input
              type="text"
              placeholder="Поиск..."
              value={versionSearch}
              onChange={(e) => setVersionSearch(e.target.value)}
              className="w-full px-3 py-2 pl-9 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-modrinth-green transition-colors"
            />
            <svg 
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />
            </svg>
          </div>

          <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar pr-2 mb-2">
            {(() => {
              const versions = showAllVersions ? MC_VERSIONS_FULL : MC_VERSIONS_RELEASE
              const filteredVersions = versionSearch
                ? versions.filter(v => v.toLowerCase().includes(versionSearch.toLowerCase()))
                : versions
              
              return filteredVersions.map(version => {
                const isSelected = selectedVersions.includes(version)
                return (
                <button
                  key={version}
                  onClick={() => toggleVersion(version)}
                  className={`w-full text-left px-3 py-1.5 rounded-full text-sm transition-all group flex items-center justify-between ${
                    isSelected
                      ? 'bg-modrinth-green text-black font-semibold'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span>{version}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )})
            })()}
          </div>

          <div className="pt-2 border-t border-gray-800">
            <button
              onClick={() => setShowAllVersions(!showAllVersions)}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded transition-colors group"
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                showAllVersions 
                  ? 'bg-modrinth-green border-modrinth-green' 
                  : 'border-gray-600 group-hover:border-gray-500'
              }`}>
                {showAllVersions && (
                  <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                Показать все версии
              </span>
            </button>
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Загрузчик</h3>
          <div className="space-y-1.5">
            {PLUGIN_LOADERS.map(loader => (
              <CatalogFilterOption
                key={loader.id}
                icon={loader.icon}
                label={loader.name}
                selected={selectedLoaders.includes(loader.id)}
                excluded={excludedLoaders.includes(loader.id)}
                onInclude={() => toggleLoader(loader.id)}
                onExclude={() => excludeLoader(loader.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Платформа</h3>
          <div className="space-y-1.5">
            {PLUGIN_PLATFORMS.map(platform => (
              <CatalogFilterOption
                key={platform.id}
                icon={platform.icon}
                label={platform.name}
                selected={selectedPlatforms.includes(platform.id)}
                excluded={excludedPlatforms.includes(platform.id)}
                onInclude={() => togglePlatform(platform.id)}
                onExclude={() => excludePlatform(platform.id)}
              />
            ))}
          </div>
        </div>

        <LicenseFilter />

        <AdvancedExclusionsFilter />

        {(selectedVersions.length > 0 || selectedLoaders.length > 0 || excludedLoaders.length > 0 || selectedPlatforms.length > 0 || excludedPlatforms.length > 0 || selectedCategories.length > 0 || excludedCategories.length > 0 || parseOpenSourceFilter(searchParams) !== 'none' || searchQuery) && (
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-3">
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedVersions([])
                setSelectedLoaders([])
                setExcludedLoaders([])
                setSelectedPlatforms([])
                setExcludedPlatforms([])
                setSelectedCategories([])
                setExcludedCategories([])
                const sort = searchParams.get('sort')
                saveVisibleDisclosureExclusions([], '/plugins')
                saveStoredOpenSource('none')
                router.push(catalogResetUrl('/plugins', { sort }))
              }}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-600/30 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
