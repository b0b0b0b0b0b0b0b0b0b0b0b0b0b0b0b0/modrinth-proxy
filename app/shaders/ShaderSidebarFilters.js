'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMinecraftVersions } from '@/app/hooks/useMinecraftVersions'
import { SHADER_STYLES, SHADER_FEATURES, SHADER_PERFORMANCE } from '@/lib/shaderCategories'
import { SHADER_LOADERS } from '@/lib/loaders'
import { parseVersionParams, appendVersionParams } from '@/lib/catalogVersionParams'

export default function ShaderSidebarFilters({ onFilterChange, isMobile = false, initialVersions = null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hookVersions = useMinecraftVersions()
  const MC_VERSIONS_RELEASE = initialVersions?.release || hookVersions.release
  const MC_VERSIONS_FULL = initialVersions?.full || hookVersions.full
  
  const parseFacets = () => {
    const fParams = searchParams.getAll('f')
    const gParams = searchParams.getAll('g')
    
    const styles = []
    const features = []
    const performance = []
    const loaders = []
    
    const styleIds = SHADER_STYLES.map(s => s.id)
    const featureIds = SHADER_FEATURES.map(f => f.id)
    const performanceIds = SHADER_PERFORMANCE.map(p => p.id)
    
    const processParam = (param) => {
      if (!param) return
      let decoded = decodeURIComponent(param)
      
      if (decoded.includes('categories:')) {
        const value = decoded.replace('categories:', '')
        
        if (styleIds.includes(value)) {
          styles.push(value)
        } else if (featureIds.includes(value)) {
          features.push(value)
        } else if (performanceIds.includes(value)) {
          performance.push(value)
        }
      }
    }
    
    fParams.forEach(processParam)
    
    gParams.forEach(param => {
      if (!param) return
      const decoded = decodeURIComponent(param)
      if (decoded.includes('categories:')) {
        const value = decoded.replace('categories:', '')
        loaders.push(value)
      }
    })
    
    const lParam = searchParams.get('l')
    const openSource = lParam === 'open_source:true'
    
    return { styles, features, performance, loaders, openSource }
  }
  
  const { styles: initialStyles, features: initialFeatures, performance: initialPerformance, loaders: initialLoaders, openSource: initialOpenSource } = parseFacets()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedVersions, setSelectedVersions] = useState(parseVersionParams(searchParams))
  const [selectedStyles, setSelectedStyles] = useState(initialStyles)
  const [selectedFeatures, setSelectedFeatures] = useState(initialFeatures)
  const [selectedPerformance, setSelectedPerformance] = useState(initialPerformance)
  const [selectedLoaders, setSelectedLoaders] = useState(initialLoaders)
  const [openSource, setOpenSource] = useState(initialOpenSource)
  const [showAllVersions, setShowAllVersions] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')

  useEffect(() => {
    const parsedFilters = parseFacets()
    const urlQuery = searchParams.get('q') || ''
    
    setSearchQuery(urlQuery)
    setSelectedVersions(parseVersionParams(searchParams))
    setSelectedStyles(parsedFilters.styles)
    setSelectedFeatures(parsedFilters.features)
    setSelectedPerformance(parsedFilters.performance)
    setSelectedLoaders(parsedFilters.loaders)
    setOpenSource(parsedFilters.openSource)
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
    const currentFeatures = updates.feat !== undefined ? updates.feat : selectedFeatures
    const currentPerformance = updates.p !== undefined ? updates.p : selectedPerformance
    const currentLoaders = updates.l !== undefined ? updates.l : selectedLoaders
    
    currentStyles.forEach(s => params.append('f', `categories:${s}`))
    currentFeatures.forEach(f => params.append('f', `categories:${f}`))
    currentPerformance.forEach(p => params.append('f', `categories:${p}`))
    currentLoaders.forEach(l => params.append('g', `categories:${l}`))
    
    const currentOpenSource = updates.os !== undefined ? updates.os : openSource
    if (currentOpenSource) params.set('l', 'open_source:true')
    
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    
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
    const newStyles = selectedStyles.includes(styleId)
      ? selectedStyles.filter(s => s !== styleId)
      : [...selectedStyles, styleId]
    setSelectedStyles(newStyles)
    updateFilters({ s: newStyles })
  }

  const toggleFeature = (featureId) => {
    const newFeatures = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter(f => f !== featureId)
      : [...selectedFeatures, featureId]
    setSelectedFeatures(newFeatures)
    updateFilters({ feat: newFeatures })
  }

  const togglePerformance = (performanceId) => {
    const newPerformance = selectedPerformance.includes(performanceId)
      ? selectedPerformance.filter(p => p !== performanceId)
      : [...selectedPerformance, performanceId]
    setSelectedPerformance(newPerformance)
    updateFilters({ p: newPerformance })
  }

  const toggleLoader = (loaderId) => {
    const newLoaders = selectedLoaders.includes(loaderId)
      ? selectedLoaders.filter(l => l !== loaderId)
      : [...selectedLoaders, loaderId]
    setSelectedLoaders(newLoaders)
    updateFilters({ l: newLoaders })
  }

  return (
    <div className={isMobile ? "w-full" : "hidden lg:block w-80 flex-shrink-0"}>
      <div className="space-y-4">
        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Категории</h3>
          <div className="space-y-1.5 pr-2">
            {SHADER_STYLES.map(style => {
              const isSelected = selectedStyles.includes(style.id)
              
              return (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4">{style.icon}</div>
                  <span className="truncate text-sm flex-1">{style.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Особенности</h3>
          <div className="space-y-1.5 pr-2">
            {SHADER_FEATURES.map(feature => {
              const isSelected = selectedFeatures.includes(feature.id)
              
              return (
                <button
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4">{feature.icon}</div>
                  <span className="truncate text-sm flex-1">{feature.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Производительность</h3>
          <div className="space-y-1.5">
            {SHADER_PERFORMANCE.map(perf => {
              const isSelected = selectedPerformance.includes(perf.id)
              
              return (
                <button
                  key={perf.id}
                  onClick={() => togglePerformance(perf.id)}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4">{perf.icon}</div>
                  <span className="truncate text-sm flex-1">{perf.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
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
            {SHADER_LOADERS.map(loader => {
              const isSelected = selectedLoaders.includes(loader.id)
              
              return (
                <button
                  key={loader.id}
                  onClick={() => toggleLoader(loader.id)}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                      : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="h-4 w-4">{loader.icon}</div>
                  <span className="truncate text-sm flex-1">{loader.name}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Прочее</h3>
          <button
            onClick={() => {
              const newOpenSource = !openSource
              setOpenSource(newOpenSource)
              updateFilters({ os: newOpenSource })
            }}
            className={`w-full text-left px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              openSource
                ? 'text-white hover:brightness-125 bg-modrinth-green/25'
                : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="truncate text-sm flex-1">Открытый исходный код</span>
            {openSource && (
              <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </button>
        </div>

        {(selectedVersions.length > 0 || selectedStyles.length > 0 || selectedFeatures.length > 0 || selectedPerformance.length > 0 || selectedLoaders.length > 0 || openSource || searchQuery) && (
          <div className="bg-modrinth-dark border border-gray-800 rounded-xl p-3">
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedVersions([])
              setSelectedStyles([])
              setSelectedFeatures([])
              setSelectedPerformance([])
              setSelectedLoaders([])
              setOpenSource(false)
              const sort = searchParams.get('sort')
              router.push(sort ? `/shaders?sort=${sort}` : '/shaders')
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
