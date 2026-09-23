'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMinecraftVersions } from '@/app/hooks/useMinecraftVersions'
import { RESOURCEPACK_CATEGORIES } from '@/lib/resourcepackCategories'
import { parseVersionParams, appendVersionParams } from '@/lib/catalogVersionParams'
import { appendFacetParams, parseFacetList, pickIds, toggleExcluded, toggleIncluded } from '@/lib/catalogFacetParams'
import { appendDisclosureExclusionParams, catalogResetUrl, saveVisibleDisclosureExclusions } from '@/lib/disclosureExclusions'
import { copyOpenSourceParams, parseOpenSourceFilter, saveStoredOpenSource } from '@/lib/openSourceFilter'
import AdvancedExclusionsFilter from '@/app/components/AdvancedExclusionsFilter'
import LicenseFilter from '@/app/components/LicenseFilter'
import CatalogFilterOption from '@/app/components/CatalogFilterOption'

const CATEGORIES = [
  {
    id: 'combat',
    name: 'Бой',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <path d="M17.573 20.038 3.849 7.913 2.753 2.755 7.838 4.06 19.47 18.206l-1.898 1.832zM7.45 14.455l-3.043 3.661 1.887 1.843 3.717-3.25M16.75 10.82l3.333-2.913 1.123-5.152-5.091 1.28-2.483 2.985" />
        <path d="m21.131 16.602-5.187 5.01 2.596-2.508 2.667 2.761M2.828 16.602l5.188 5.01-2.597-2.508-2.667 2.761" />
      </svg>
    ),
  },
  {
    id: 'cursed',
    name: 'Проклятое',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <rect width="10" height="14" x="7" y="7.5" rx="5" />
        <path d="m2 12.5 2 2h3M22 12.5l-2 2h-3M3 21.5l2-3 2-1M21 21.5l-2-3-2-1M3 8.5l2 2 2 1M21 8.5l-2 2-2 1M12 7.5v14M15.38 8.82A3 3 0 0 0 16 7h0a3 3 0 0 0-3-3h-2a3 3 0 0 0-3 3h0a3 3 0 0 0 .61 1.82M9 4.5l-1-2M15 4.5l1-2" />
      </svg>
    ),
  },
  {
    id: 'decoration',
    name: 'Декорации',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    id: 'modded',
    name: 'Модифицированное',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    id: 'realistic',
    name: 'Реалистичное',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    ),
  },
  {
    id: 'simplistic',
    name: 'Минималистичное',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16" />
      </svg>
    ),
  },
  {
    id: 'themed',
    name: 'Тематическое',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <path d="m12 19 7-7 3 3-7 7z" />
        <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18zM2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    id: 'tweaks',
    name: 'Изменения',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
      </svg>
    ),
  },
  {
    id: 'utility',
    name: 'Утилиты',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    id: 'vanilla-like',
    name: 'Ванильное',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
        <path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11M17 7A5 5 0 0 0 7 7M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" />
      </svg>
    ),
  },
]

const RESOLUTIONS = [
  { id: '8x-', name: '8x или меньше' },
  { id: '16x', name: '16x' },
  { id: '32x', name: '32x' },
  { id: '48x', name: '48x' },
  { id: '64x', name: '64x' },
  { id: '128x', name: '128x' },
  { id: '256x', name: '256x' },
]

export default function ResourcepackSidebarFilters({ onFilterChange, isMobile = false, initialVersions = null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hookVersions = useMinecraftVersions()
  const MC_VERSIONS_RELEASE = initialVersions?.release || hookVersions.release
  const MC_VERSIONS_FULL = initialVersions?.full || hookVersions.full
  
  const parseFacets = () => {
    const categoryIds = CATEGORIES.map(c => c.id)
    const featureIds = RESOURCEPACK_CATEGORIES.map(f => f.id)
    const resolutionIds = RESOLUTIONS.map(r => r.id)
    const f = parseFacetList(searchParams.getAll('f'))
    return {
      categories: pickIds(f.included, categoryIds),
      excludedCategories: pickIds(f.excluded, categoryIds),
      features: pickIds(f.included, featureIds),
      excludedFeatures: pickIds(f.excluded, featureIds),
      resolutions: pickIds(f.included, resolutionIds),
      excludedResolutions: pickIds(f.excluded, resolutionIds),
    }
  }
  
  const { 
    categories: initialCategories,
    excludedCategories: initialExcludedCategories,
    features: initialFeatures,
    excludedFeatures: initialExcludedFeatures,
    resolutions: initialResolutions,
    excludedResolutions: initialExcludedResolutions,
  } = parseFacets()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedVersions, setSelectedVersions] = useState(parseVersionParams(searchParams))
  const [selectedCategories, setSelectedCategories] = useState(initialCategories)
  const [excludedCategories, setExcludedCategories] = useState(initialExcludedCategories)
  const [selectedFeatures, setSelectedFeatures] = useState(initialFeatures)
  const [excludedFeatures, setExcludedFeatures] = useState(initialExcludedFeatures)
  const [selectedResolutions, setSelectedResolutions] = useState(initialResolutions)
  const [excludedResolutions, setExcludedResolutions] = useState(initialExcludedResolutions)
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')

  useEffect(() => {
    const parsedFilters = parseFacets()
    const urlQuery = searchParams.get('q') || ''
    
    setSearchQuery(urlQuery)
    setSelectedVersions(parseVersionParams(searchParams))
    setSelectedCategories(parsedFilters.categories)
    setExcludedCategories(parsedFilters.excludedCategories)
    setSelectedFeatures(parsedFilters.features)
    setExcludedFeatures(parsedFilters.excludedFeatures)
    setSelectedResolutions(parsedFilters.resolutions)
    setExcludedResolutions(parsedFilters.excludedResolutions)
  }, [searchParams])

  const updateFilters = (updates) => {
    const params = new URLSearchParams()
    
    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q)
    } else {
      const q = searchParams.get('q')
      if (q) params.set('q', q)
    }
    
    if (updates.v !== undefined) {
      appendVersionParams(params, updates.v)
    } else {
      appendVersionParams(params, parseVersionParams(searchParams))
    }
    
    const currentCategories = updates.c !== undefined ? updates.c : selectedCategories
    const currentExcludedCategories = updates.xc !== undefined ? updates.xc : excludedCategories
    const currentFeatures = updates.feat !== undefined ? updates.feat : selectedFeatures
    const currentExcludedFeatures = updates.xf !== undefined ? updates.xf : excludedFeatures
    const currentResolutions = updates.r !== undefined ? updates.r : selectedResolutions
    const currentExcludedResolutions = updates.xr !== undefined ? updates.xr : excludedResolutions

    appendFacetParams(
      params,
      'f',
      [...currentCategories, ...currentFeatures, ...currentResolutions],
      [...currentExcludedCategories, ...currentExcludedFeatures, ...currentExcludedResolutions],
    )
    
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    copyOpenSourceParams(params, searchParams)
    appendDisclosureExclusionParams(params, searchParams, '/resourcepacks')
    
    router.push(`/resourcepacks?${params.toString()}`)
    onFilterChange?.()
  }

  const toggleVersion = (version) => {
    const next = selectedVersions.includes(version)
      ? selectedVersions.filter((v) => v !== version)
      : [...selectedVersions, version]
    setSelectedVersions(next)
    updateFilters({ v: next })
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

  const toggleResolution = (resolutionId) => {
    const next = toggleIncluded(resolutionId, selectedResolutions, excludedResolutions)
    setSelectedResolutions(next.included)
    setExcludedResolutions(next.excluded)
    updateFilters({ r: next.included, xr: next.excluded })
  }

  const excludeResolution = (resolutionId) => {
    const next = toggleExcluded(resolutionId, selectedResolutions, excludedResolutions)
    setSelectedResolutions(next.included)
    setExcludedResolutions(next.excluded)
    updateFilters({ r: next.included, xr: next.excluded })
  }

  return (
    <div className={isMobile ? "w-full" : "hidden lg:block w-80 flex-shrink-0"}>
      <div className="space-y-4">
        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Категории
          </h3>
          <div className="space-y-1.5 pr-2">
            {CATEGORIES.map(cat => (
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Особенности
          </h3>
          <div className="space-y-1.5 pr-2">
            {RESOURCEPACK_CATEGORIES.map(feature => (
              <CatalogFilterOption
                key={feature.id}
                icon={feature.icon}
                label={feature.name}
                selected={selectedFeatures.includes(feature.id)}
                excluded={excludedFeatures.includes(feature.id)}
                onInclude={() => toggleFeature(feature.id)}
                onExclude={() => excludeFeature(feature.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Разрешение
          </h3>
          <div className="space-y-1.5">
            {RESOLUTIONS.map(res => (
              <CatalogFilterOption
                key={res.id}
                label={res.name}
                selected={selectedResolutions.includes(res.id)}
                excluded={excludedResolutions.includes(res.id)}
                onInclude={() => toggleResolution(res.id)}
                onExclude={() => excludeResolution(res.id)}
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

        <LicenseFilter />

        <AdvancedExclusionsFilter />

        {(selectedVersions.length > 0 || selectedCategories.length > 0 || excludedCategories.length > 0 || selectedFeatures.length > 0 || excludedFeatures.length > 0 || selectedResolutions.length > 0 || excludedResolutions.length > 0 || parseOpenSourceFilter(searchParams) !== 'none' || searchQuery) && (
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-3">
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedVersions([])
                setSelectedCategories([])
                setExcludedCategories([])
                setSelectedFeatures([])
                setExcludedFeatures([])
                setSelectedResolutions([])
                setExcludedResolutions([])
                const sort = searchParams.get('sort')
                saveVisibleDisclosureExclusions([], '/resourcepacks')
                saveStoredOpenSource('none')
                router.push(catalogResetUrl('/resourcepacks', { sort }))
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
