'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMinecraftVersions } from '@/app/hooks/useMinecraftVersions'
import { SERVER_TYPES, SERVER_FEATURES, SERVER_GAMEPLAY, SERVER_CONFIG, SERVER_COMMUNITY, SERVER_REGIONS, SERVER_LANGUAGES } from '@/lib/serverCategories'
import { appendDisclosureExclusionParams, catalogResetUrl, parseDisclosureExclusions, saveVisibleDisclosureExclusions } from '@/lib/disclosureExclusions'
import { appendFacetParams, parseFacetList, toggleExcluded, toggleIncluded } from '@/lib/catalogFacetParams'
import AdvancedExclusionsFilter from '@/app/components/AdvancedExclusionsFilter'
import CatalogFilterOption from '@/app/components/CatalogFilterOption'
import { useI18n } from '@/app/components/I18nProvider'
import { categoryLabel, languageDisplayName, serverRegionLabel } from '@/lib/i18n/label'

export default function ServerSidebarFilters({ onFilterChange, isMobile = false, initialVersions = null }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const hookVersions = useMinecraftVersions()
  const MC_VERSIONS_RELEASE = initialVersions?.release || hookVersions.release
  const MC_VERSIONS_FULL = initialVersions?.full || hookVersions.full

  const parseFacets = () => {
    const scParams = searchParams.getAll('sc')
    const sctParams = searchParams.getAll('sct')
    const fParams = searchParams.getAll('f')

    const categories = [...scParams]

    sctParams.forEach(val => {
      if (val === 'vanilla' && !categories.includes('type-vanilla')) {
        categories.push('type-vanilla')
      } else if (val === 'modpack' && !categories.includes('type-modded')) {
        categories.push('type-modded')
      }
    })

    fParams.forEach(param => {
      if (!param) return
      const decoded = decodeURIComponent(param)
      if (decoded.includes('categories:')) {
        const value = decoded.replace('categories:', '')
        if (!categories.includes(value)) {
          categories.push(value)
        }
      }
    })

    const version = searchParams.get('sgv') || searchParams.get('v') || ''

    const f = parseFacetList(searchParams.getAll('f'))
    return { categories, version, excludedCategories: f.excluded }
  }

  const { categories: initialCategories, version: initialVersion, excludedCategories: initialExcludedCategories } = parseFacets()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedVersion, setSelectedVersion] = useState(initialVersion)
  const [selectedCategories, setSelectedCategories] = useState(initialCategories)
  const [excludedCategories, setExcludedCategories] = useState(initialExcludedCategories)
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('sst') || 'online')
  const [selectedRegions, setSelectedRegions] = useState(searchParams.getAll('sr') || [])
  const [selectedLanguages, setSelectedLanguages] = useState(searchParams.getAll('sl') || [])

  const [showAllVersions, setShowAllVersions] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')
  const [showAllLanguages, setShowAllLanguages] = useState(false)
  const [languageSearch, setLanguageSearch] = useState('')

  const [openSections, setOpenSections] = useState({
    type: true,
    features: true,
    gameplay: true,
    config: true,
    community: true,
    version: true,
    region: true,
    language: true,
    status: true
  })

  useEffect(() => {
    const parsedFilters = parseFacets()
    const urlQuery = searchParams.get('q') || ''
    const urlVersion = searchParams.get('sgv') || searchParams.get('v') || ''

    setSearchQuery(urlQuery)
    setSelectedVersion(urlVersion)
    setSelectedCategories(parsedFilters.categories)
    setExcludedCategories(parsedFilters.excludedCategories)
    setSelectedStatus(searchParams.get('sst') || 'online')
    setSelectedRegions(searchParams.getAll('sr') || [])
    setSelectedLanguages(searchParams.getAll('sl') || [])
  }, [searchParams])

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateFilters = (updates) => {
    const params = new URLSearchParams()

    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q)
    } else {
      const q = searchParams.get('q')
      if (q) params.set('q', q)
    }

    if (updates.v !== undefined) {
      if (updates.v) params.set('sgv', updates.v)
    } else {
      const sgv = searchParams.get('sgv') || searchParams.get('v')
      if (sgv) params.set('sgv', sgv)
    }

    const currentCategories = updates.c !== undefined ? updates.c : selectedCategories
    const currentExcludedCategories = updates.xc !== undefined ? updates.xc : excludedCategories
    currentCategories.forEach(c => {
      if (c === 'type-vanilla') {
        params.append('sct', 'vanilla')
      } else if (c === 'type-modded') {
        params.append('sct', 'modpack')
      } else {
        params.append('sc', c)
      }
    })
    appendFacetParams(params, 'f', [], currentExcludedCategories)

    const currentStatus = updates.sst !== undefined ? updates.sst : selectedStatus
    if (currentStatus) {
      params.set('sst', currentStatus)
    }

    const currentRegions = updates.sr !== undefined ? updates.sr : selectedRegions
    currentRegions.forEach(r => {
      params.append('sr', r)
    })

    const currentLanguages = updates.sl !== undefined ? updates.sl : selectedLanguages
    currentLanguages.forEach(l => {
      params.append('sl', l)
    })

    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    appendDisclosureExclusionParams(params, searchParams, '/servers')

    router.push(`/discover/servers?${params.toString()}`)
    onFilterChange?.()
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

  const SectionHeader = ({ sectionKey, label }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full px-4 py-3 bg-transparent text-left cursor-pointer border-none"
    >
      <span className="text-sm font-semibold text-gray-300">{label}</span>
      <svg
        className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${openSections[sectionKey] ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )

  const CategoryButton = ({ cat }) => (
    <CatalogFilterOption
      icon={cat.icon}
      label={categoryLabel(t, cat.id, cat.name)}
      selected={selectedCategories.includes(cat.id)}
      excluded={excludedCategories.includes(cat.id)}
      onInclude={() => toggleCategory(cat.id)}
      onExclude={() => excludeCategory(cat.id)}
    />
  )

  return (
    <div className={isMobile ? "w-full" : "hidden lg:block w-80 flex-shrink-0"}>
      <div className="space-y-4">

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="type" label={t('filter.type')} />
          {openSections.type && (
            <div className="p-4 pt-0 space-y-1">
              {SERVER_TYPES.map(cat => <CategoryButton key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="features" label={t('filter.features')} />
          {openSections.features && (
            <div className="p-4 pt-0 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {SERVER_FEATURES.map(cat => <CategoryButton key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="gameplay" label={t('filter.gameplay')} />
          {openSections.gameplay && (
            <div className="p-4 pt-0 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {SERVER_GAMEPLAY.map(cat => <CategoryButton key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="config" label={t('filter.config')} />
          {openSections.config && (
            <div className="p-4 pt-0 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {SERVER_CONFIG.map(cat => <CategoryButton key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="community" label={t('filter.community')} />
          {openSections.community && (
            <div className="p-4 pt-0 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {SERVER_COMMUNITY.map(cat => <CategoryButton key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="version" label={t('filter.gameVersion')} />
          {openSections.version && (
            <div className="p-4 pt-0">
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

                  return filteredVersions.map(version => (
                    <button
                      key={version}
                      onClick={() => {
                        const newVersion = selectedVersion === version ? '' : version
                        setSelectedVersion(newVersion)
                        updateFilters({ v: newVersion })
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-full text-sm transition-all group flex items-center justify-between ${
                        selectedVersion === version
                          ? 'bg-modrinth-green text-black font-semibold'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <span>{version}</span>
                      {selectedVersion === version && (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  ))
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
          )}
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="region" label={t('filter.region')} />
          {openSections.region && (
            <div className="p-4 pt-0 space-y-1">
              {SERVER_REGIONS.map(reg => {
                const isSelected = selectedRegions.includes(reg.id)
                return (
                  <button
                    key={reg.id}
                    onClick={() => {
                      let newRegions = [...selectedRegions]
                      if (newRegions.includes(reg.id)) {
                        newRegions = newRegions.filter(r => r !== reg.id)
                      } else {
                        newRegions.push(reg.id)
                      }
                      setSelectedRegions(newRegions)
                      updateFilters({ sr: newRegions })
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 group ${
                      isSelected
                        ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                        : 'bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <svg className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="truncate text-sm flex-1">{serverRegionLabel(t, reg.id, reg.name)}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="language" label={t('filter.language')} />
          {openSections.language && (
            <div className="p-4 pt-0">
              <div className="mb-2 relative">
                <input
                  type="text"
                  placeholder={t('filter.search')}
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
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
                  const filtered = languageSearch
                    ? SERVER_LANGUAGES.filter((l) => {
                        const q = languageSearch.toLowerCase()
                        const display = languageDisplayName(locale, l.id)
                        return (
                          display.toLowerCase().includes(q) ||
                          l.id.toLowerCase().includes(q) ||
                          l.name.toLowerCase().includes(q)
                        )
                      })
                    : (showAllLanguages ? SERVER_LANGUAGES : SERVER_LANGUAGES.filter(l => ['ru', 'en'].includes(l.id) || selectedLanguages.includes(l.id)))

                  return filtered.map(lang => {
                    const isSelected = selectedLanguages.includes(lang.id)
                    return (
                      <button
                        key={lang.id}
                        onClick={() => {
                          let newLanguages = [...selectedLanguages]
                          if (newLanguages.includes(lang.id)) {
                            newLanguages = newLanguages.filter(l => l !== lang.id)
                          } else {
                            newLanguages.push(lang.id)
                          }
                          setSelectedLanguages(newLanguages)
                          updateFilters({ sl: newLanguages })
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 group ${
                          isSelected
                            ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                            : 'bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white'
                        }`}
                      >
                        <span className="truncate text-sm flex-1">{languageDisplayName(locale, lang.id)}</span>
                        {isSelected && (
                          <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    )
                  })
                })()}
              </div>

              {!languageSearch && (
                <div className="pt-2 border-t border-gray-800">
                  <button
                    onClick={() => setShowAllLanguages(!showAllLanguages)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded transition-colors group"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      showAllLanguages
                        ? 'bg-modrinth-green border-modrinth-green'
                        : 'border-gray-600 group-hover:border-gray-500'
                    }`}>
                      {showAllLanguages && (
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                      {t('filter.showAllLanguages')}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl overflow-hidden">
          <SectionHeader sectionKey="status" label={t('filter.status')} />
          {openSections.status && (
            <div className="p-4 pt-0 space-y-1">
              <button
                onClick={() => {
                  setSelectedStatus('online')
                  updateFilters({ sst: 'online' })
                }}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 group ${
                  selectedStatus === 'online'
                    ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                    : 'bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-full ${selectedStatus === 'online' ? 'bg-modrinth-green shadow-[0_0_8px_rgba(236,127,171,0.5)]' : 'bg-gray-600'}`}></div>
                <span className="truncate text-sm flex-1">{t('server.onlineBadge')}</span>
                {selectedStatus === 'online' && (
                  <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedStatus('offline')
                  updateFilters({ sst: 'offline' })
                }}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 group ${
                  selectedStatus === 'offline'
                    ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                    : 'bg-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-full ${selectedStatus === 'offline' ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                <span className="truncate text-sm flex-1">{t('server.offline')}</span>
                {selectedStatus === 'offline' && (
                  <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        <AdvancedExclusionsFilter />

        {(selectedVersion || selectedCategories.length > 0 || excludedCategories.length > 0 || searchQuery || selectedStatus !== 'online' || selectedRegions.length > 0 || selectedLanguages.length > 0 || parseDisclosureExclusions(searchParams).length > 0) && (
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-3">
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedVersion('')
                setSelectedCategories([])
                setExcludedCategories([])
                setSelectedStatus('online')
                setSelectedRegions([])
                setSelectedLanguages([])
                const sort = searchParams.get('sort')
                saveVisibleDisclosureExclusions([], '/servers')
                router.push(catalogResetUrl('/discover/servers', { sort, sst: 'online' }))
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
