'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMinecraftVersions } from '@/app/hooks/useMinecraftVersions'
import { SHADER_STYLES, SHADER_FEATURES, SHADER_PERFORMANCE } from '@/lib/shaderCategories'
import { SHADER_LOADERS } from '@/lib/loaders'
import { parseVersionParams, appendVersionParams } from '@/lib/catalogVersionParams'
import { appendFacetParams, parseFacetList, pickIds, toggleExcluded, toggleIncluded } from '@/lib/catalogFacetParams'
import { appendDisclosureExclusionParams, catalogResetUrl, saveVisibleDisclosureExclusions } from '@/lib/disclosureExclusions'
import { copyOpenSourceParams, parseOpenSourceFilter, saveStoredOpenSource } from '@/lib/openSourceFilter'
import AdvancedExclusionsFilter from '@/app/components/AdvancedExclusionsFilter'
import LicenseFilter from '@/app/components/LicenseFilter'
import CatalogFilterOption from '@/app/components/CatalogFilterOption'
import { useT } from '@/app/components/I18nProvider'
import { categoryLabel } from '@/lib/i18n/label'

export default function ShaderSidebarFilters({ onFilterChange, isMobile = false, initialVersions = null }) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hookVersions = useMinecraftVersions()
  const MC_VERSIONS_RELEASE = initialVersions?.release || hookVersions.release
  const MC_VERSIONS_FULL = initialVersions?.full || hookVersions.full
  
  const parseFacets = () => {
    const styleIds = SHADER_STYLES.map(s => s.id)
    const featureIds = SHADER_FEATURES.map(f => f.id)
    const performanceIds = SHADER_PERFORMANCE.map(p => p.id)
    const f = parseFacetList(searchParams.getAll('f'))
    const g = parseFacetList(searchParams.getAll('g'))
    return {
      styles: pickIds(f.included, styleIds),
      excludedStyles: pickIds(f.excluded, styleIds),
      features: pickIds(f.included, featureIds),
      excludedFeatures: pickIds(f.excluded, featureIds),
      performance: pickIds(f.included, performanceIds),
      excludedPerformance: pickIds(f.excluded, performanceIds),
      loaders: g.included,
      excludedLoaders: g.excluded,
    }
  }
  
  const { styles: initialStyles, excludedStyles: initialExcludedStyles, features: initialFeatures, excludedFeatures: initialExcludedFeatures, performance: initialPerformance, excludedPerformance: initialExcludedPerformance, loaders: initialLoaders, excludedLoaders: initialExcludedLoaders } = parseFacets()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedVersions, setSelectedVersions] = useState(parseVersionParams(searchParams))
  const [selectedStyles, setSelectedStyles] = useState(initialStyles)
  const [excludedStyles, setExcludedStyles] = useState(initialExcludedStyles)
  const [selectedFeatures, setSelectedFeatures] = useState(initialFeatures)
  const [excludedFeatures, setExcludedFeatures] = useState(initialExcludedFeatures)
  const [selectedPerformance, setSelectedPerformance] = useState(initialPerformance)
  const [excludedPerformance, setExcludedPerformance] = useState(initialExcludedPerformance)
  const [selectedLoaders, setSelectedLoaders] = useState(initialLoaders)
  const [excludedLoaders, setExcludedLoaders] = useState(initialExcludedLoaders)
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')

  useEffect(() => {
    const parsedFilters = parseFacets()
    const urlQuery = searchParams.get('q') || ''
    
    setSearchQuery(urlQuery)
    setSelectedVersions(parseVersionParams(searchParams))
    setSelectedStyles(parsedFilters.styles)
    setExcludedStyles(parsedFilters.excludedStyles)
    setSelectedFeatures(parsedFilters.features)
    setExcludedFeatures(parsedFilters.excludedFeatures)
    setSelectedPerformance(parsedFilters.performance)
    setExcludedPerformance(parsedFilters.excludedPerformance)
    setSelectedLoaders(parsedFilters.loaders)
    setExcludedLoaders(parsedFilters.excludedLoaders)
  }, [searchParams])

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
    
    const currentStyles = updates.s !== undefined ? updates.s : selectedStyles
    const currentExcludedStyles = updates.xs !== undefined ? updates.xs : excludedStyles
    const currentFeatures = updates.feat !== undefined ? updates.feat : selectedFeatures
    const currentExcludedFeatures = updates.xf !== undefined ? updates.xf : excludedFeatures
    const currentPerformance = updates.p !== undefined ? updates.p : selectedPerformance
    const currentExcludedPerformance = updates.xp !== undefined ? updates.xp : excludedPerformance
    const currentLoaders = updates.l !== undefined ? updates.l : selectedLoaders
    const currentExcludedLoaders = updates.xl !== undefined ? updates.xl : excludedLoaders

    appendFacetParams(
      params,
      'f',
      [...currentStyles, ...currentFeatures, ...currentPerformance],
      [...currentExcludedStyles, ...currentExcludedFeatures, ...currentExcludedPerformance],
    )
    appendFacetParams(params, 'g', currentLoaders, currentExcludedLoaders)
    
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    copyOpenSourceParams(params, searchParams)
    appendDisclosureExclusionParams(params, searchParams, '/shaders')
    
    router.push(`/shaders?${params.toString()}`)
    onFilterChange?.()
  }

  const toggleVersion = (version) => {
    const next = selectedVersions.includes(version)
      ? selectedVersions.filter((v) => v !== version)
      : [...selectedVersions, version]
    setSelectedVersions(next)
    updateFilters({ v: next })
  }

  const toggleStyle = (styleId) => {
    const next = toggleIncluded(styleId, selectedStyles, excludedStyles)
    setSelectedStyles(next.included)
    setExcludedStyles(next.excluded)
    updateFilters({ s: next.included, xs: next.excluded })
  }

  const excludeStyle = (styleId) => {
    const next = toggleExcluded(styleId, selectedStyles, excludedStyles)
    setSelectedStyles(next.included)
    setExcludedStyles(next.excluded)
    updateFilters({ s: next.included, xs: next.excluded })
  }

  const toggleFeature = (featureId) => {
    const next = toggleIncluded(featureId, selectedFeatures, excludedFeatures)
    setSelectedFeatures(next.included)
    setExcludedFeatures(next.excluded)
    updateFilters({ feat: next.included, xf: next.excluded })
  }

  const excludeFeature = (featureId) => {
    const next = toggleExcluded(featureId, selectedFeatures, excludedFeatures)
    setSelectedFeatures(next.included)
    setExcludedFeatures(next.excluded)
    updateFilters({ feat: next.included, xf: next.excluded })
  }

  const togglePerformance = (performanceId) => {
    const next = toggleIncluded(performanceId, selectedPerformance, excludedPerformance)
    setSelectedPerformance(next.included)
    setExcludedPerformance(next.excluded)
    updateFilters({ p: next.included, xp: next.excluded })
  }

  const excludePerformance = (performanceId) => {
    const next = toggleExcluded(performanceId, selectedPerformance, excludedPerformance)
    setSelectedPerformance(next.included)
    setExcludedPerformance(next.excluded)
    updateFilters({ p: next.included, xp: next.excluded })
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

  return (
    <div className={isMobile ? "w-full" : "hidden lg:block w-80 flex-shrink-0"}>
      <div className="space-y-4">
        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('filter.categories')}</h3>
          <div className="space-y-1.5 pr-2">
            {SHADER_STYLES.map(style => (
              <CatalogFilterOption
                key={style.id}
                icon={style.icon}
                label={categoryLabel(t, style.id, style.name)}
                selected={selectedStyles.includes(style.id)}
                excluded={excludedStyles.includes(style.id)}
                onInclude={() => toggleStyle(style.id)}
                onExclude={() => excludeStyle(style.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('filter.features')}</h3>
          <div className="space-y-1.5 pr-2">
            {SHADER_FEATURES.map(feature => (
              <CatalogFilterOption
                key={feature.id}
                icon={feature.icon}
                label={categoryLabel(t, feature.id, feature.name)}
                selected={selectedFeatures.includes(feature.id)}
                excluded={excludedFeatures.includes(feature.id)}
                onInclude={() => toggleFeature(feature.id)}
                onExclude={() => excludeFeature(feature.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('filter.performance')}</h3>
          <div className="space-y-1.5">
            {SHADER_PERFORMANCE.map(perf => (
              <CatalogFilterOption
                key={perf.id}
                icon={perf.icon}
                label={categoryLabel(t, perf.id, perf.name)}
                selected={selectedPerformance.includes(perf.id)}
                excluded={excludedPerformance.includes(perf.id)}
                onInclude={() => togglePerformance(perf.id)}
                onExclude={() => excludePerformance(perf.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            {t('filter.gameVersion')}
          </h3>
          <div className="mb-2 relative">
            <input
              type="text"
              placeholder={t('filter.search')}
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
                {t('filter.showAllVersions')}
              </span>
              </button>
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('filter.loader')}</h3>
          <div className="space-y-1.5">
            {SHADER_LOADERS.map(loader => (
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

        <LicenseFilter />

        <AdvancedExclusionsFilter />

        {(selectedVersions.length > 0 || selectedStyles.length > 0 || excludedStyles.length > 0 || selectedFeatures.length > 0 || excludedFeatures.length > 0 || selectedPerformance.length > 0 || excludedPerformance.length > 0 || selectedLoaders.length > 0 || excludedLoaders.length > 0 || parseOpenSourceFilter(searchParams) !== 'none' || searchQuery) && (
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-3">
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedVersions([])
              setSelectedStyles([])
              setExcludedStyles([])
              setSelectedFeatures([])
              setExcludedFeatures([])
              setSelectedPerformance([])
              setExcludedPerformance([])
              setSelectedLoaders([])
              setExcludedLoaders([])
              const sort = searchParams.get('sort')
              saveVisibleDisclosureExclusions([], '/shaders')
              saveStoredOpenSource('none')
              router.push(catalogResetUrl('/shaders', { sort }))
            }}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-600/30 flex items-center justify-center gap-1.5"
          >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            {t('filter.reset')}
          </button>
          </div>
        )}
      </div>
    </div>
  )
}
